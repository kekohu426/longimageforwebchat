
import { TEMPLATES } from './constants';

// 智谱 GLM API 调用
export const callGLM = async (apiKey: string, prompt: string): Promise<string> => {
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

/**
 * 诊断级错误解析器：彻底消灭 [object Object]
 */
export const stringifyError = (err: unknown): string => {
  if (err === null) return 'null';
  if (err === undefined) return 'undefined';
  if (typeof err === 'string') return err;

  try {
    if (err instanceof Error) {
      const parts: string[] = [];
      if (err.name) parts.push(`错误类型: ${err.name}`);
      if (err.message) parts.push(`错误信息: ${err.message}`);
      if (err.stack) parts.push(`调用栈: ${err.stack.split('\n').slice(0, 3).join('\n')}`);
      return parts.join('\n') || String(err);
    }

    const info: Record<string, string> = {
      '_type': Object.prototype.toString.call(err)
    };

    let current = err;
    const allProps = new Set<string>();
    while (current && current !== Object.prototype) {
      Object.getOwnPropertyNames(current).forEach(p => allProps.add(p));
      current = Object.getPrototypeOf(current);
    }

    allProps.forEach(prop => {
      try {
        const val = (err as Record<string, unknown>)[prop];
        if (typeof val !== 'function' && typeof val !== 'symbol') {
          info[prop] = String(val);
        }
      } catch {
        // 忽略
      }
    });

    if (info.name === 'SecurityError' || info.code === '18' || (info.message && info.message.includes('tainted'))) {
      return "【导出失败：图片跨域安全拦截】\n检测到有第三方图片设置了极其严厉的防盗链，禁止浏览器进行像素读取。\n\n解决办法：\n1. 请尝试删除最近粘贴的几张图片。\n2. 检查是否有 GIF 或极其高清的大图。\n3. 可以尝试手动保存图片后重新上传。";
    }

    const result = JSON.stringify(info, null, 2);
    return result === '{}' ? `[未知错误对象]: ${String(err)}` : result;
  } catch {
    return "解析报错失败: " + String(err);
  }
};

// 安全占位符
const SAFE_PLACEHOLDER = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='60' viewBox='0 0 300 60'%3E%3Crect width='300' height='60' fill='%23f1f5f9' rx='8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2364748b'%3E外部图片（导出时自动处理）%3C/text%3E%3C/svg%3E";

/**
 * 将图片转换为 base64 数据URL
 */
export const convertImageToBase64 = async (imgSrc: string): Promise<string | null> => {
  if (imgSrc.startsWith('data:') || imgSrc.startsWith('blob:')) {
    return imgSrc;
  }

  const tryWithCors = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => {
        resolve(null);
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };

      img.src = imgSrc;
    });
  };

  const tryWithProxy = async (): Promise<string | null> => {
    const proxyUrls = [
      `https://images.weserv.nl/?url=${encodeURIComponent(imgSrc)}&w=800`,
      `https://corsproxy.io/?${encodeURIComponent(imgSrc)}`
    ];

    for (const proxyUrl of proxyUrls) {
      try {
        const result = await new Promise<string | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          const timeout = setTimeout(() => resolve(null), 8000);

          img.onload = () => {
            clearTimeout(timeout);
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          };

          img.onerror = () => {
            clearTimeout(timeout);
            resolve(null);
          };

          img.src = proxyUrl;
        });

        if (result) return result;
      } catch {
        continue;
      }
    }
    return null;
  };

  let result = await tryWithCors();
  if (!result) {
    result = await tryWithProxy();
  }

  return result;
};

/**
 * 预处理 HTML 内容中的所有图片
 */
export const preprocessImagesInHtml = async (
  html: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ html: string; failedCount: number }> => {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const matches = [...html.matchAll(imgRegex)];

  let processedHtml = html;
  let failedCount = 0;
  const total = matches.length;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const fullMatch = match[0];
    const imgSrc = match[1];

    onProgress?.(i + 1, total);

    if (!imgSrc.startsWith('data:') && !imgSrc.startsWith('blob:')) {
      const base64Src = await convertImageToBase64(imgSrc);
      if (base64Src) {
        const newImgTag = fullMatch.replace(imgSrc, base64Src);
        processedHtml = processedHtml.replace(fullMatch, newImgTag);
      } else {
        const newImgTag = fullMatch.replace(imgSrc, SAFE_PLACEHOLDER);
        processedHtml = processedHtml.replace(fullMatch, newImgTag);
        failedCount++;
      }
    }
  }

  return { html: processedHtml, failedCount };
};

/**
 * 清理 HTML 内容
 */
export const cleanupHtmlContent = (html: string): string => {
  if (!html) return html;

  let cleaned = html;
  cleaned = cleaned.replace(/(<p[^>]*>(\s*(<br\s*\/?>|&nbsp;|\s)*\s*)<\/p>\s*){2,}/gi, '<p><br></p>');
  cleaned = cleaned.replace(/(<p[^>]*>(\s*(<br\s*\/?>|&nbsp;|\s)*\s*)<\/p>\s*)+$/gi, '');
  cleaned = cleaned.replace(/(<div[^>]*>(\s*(<br\s*\/?>|&nbsp;|\s)*\s*)<\/div>\s*)+$/gi, '');
  cleaned = cleaned.replace(/(<br\s*\/?>\s*)+$/gi, '');
  cleaned = cleaned.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');

  return cleaned.trim();
};

/**
 * HTML 转纯文本
 */
export const extractTextFromHtml = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};
