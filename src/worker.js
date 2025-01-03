const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <title>JSDelivr CDN 链接转换工具</title>
    <style>
      body {
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        background-color: #0a0a0a;
        color: #ffffff;
      }

      h1 {
        text-align: center;
        color: #ffffff;
        font-size: 2.5em;
        margin-bottom: 30px;
      }

      .ph-logo {
        background-color: #000000;
        padding: 10px 20px;
        border-radius: 5px;
        display: inline-block;
      }

      .ph-logo span {
        color: #ffffff;
      }

      .ph-logo span.highlight {
        color: #ff9900;
        background-color: #000000;
        padding: 3px 6px;
        border-radius: 3px;
      }

      .container {
        margin-top: 20px;
        background-color: #1b1b1b;
        padding: 20px;
        border-radius: 8px;
      }

      textarea {
        width: 100%;
        height: 150px;
        margin: 10px 0;
        padding: 15px;
        border: 2px solid #333;
        border-radius: 4px;
        background-color: #0a0a0a;
        color: #ffffff;
        font-size: 16px;
      }

      textarea:focus {
        border-color: #ff9900;
        outline: none;
      }

      button {
        padding: 12px 25px;
        color: #000000;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 10px;
        font-weight: bold;
        font-size: 16px;
        text-transform: uppercase;
      }

      .primary-btn {
        background-color: #ff9900;
      }

      .secondary-btn {
        background-color: #ffffff;
      }

      button:hover {
        opacity: 0.9;
      }

      .result-container {
        margin-top: 20px;
        border: 2px solid #333;
        border-radius: 4px;
        padding: 15px;
        background-color: #0a0a0a;
      }

      .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        border-bottom: 1px solid #333;
        background-color: #1b1b1b;
        margin-bottom: 10px;
        border-radius: 4px;
      }

      .result-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .copy-btn {
        padding: 8px 15px;
        font-size: 14px;
        background-color: #ff9900;
      }

      .error {
        color: #ff4444;
        font-size: 14px;
        margin-top: 5px;
      }

      .tabs {
        margin-bottom: 20px;
        display: flex;
        gap: 10px;
      }

      .tab {
        padding: 12px 25px;
        background-color: #1b1b1b;
        border: 2px solid #333;
        color: #ffffff;
        font-weight: bold;
      }

      .tab.active {
        background-color: #ff9900;
        border-color: #ff9900;
        color: #000000;
      }

      h3 {
        color: #ff9900;
        margin-bottom: 15px;
      }

      .url-info {
        font-size: 14px;
        color: #999;
      }

      .cdn-url {
        color: #ff9900;
        word-break: break-all;
      }
    </style>
</head>
<body>
    <h1>
      <div class="ph-logo">
        <span>JS</span><span class="highlight">Delivr</span>
      </div>
    </h1>

    <div class="tabs">
      <button class="tab active" onclick="switchTab('github')">GitHub 转换</button>
      <button class="tab" onclick="switchTab('npm')">NPM 转换</button>
    </div>

    <div class="container">
      <div id="github-tab">
        <h3>输入 GitHub 链接（每行一个）：</h3>
        <textarea id="github-input" placeholder="例如：
https://github.com/user/repo/blob/master/file.js
https://github.com/user/repo/blob/master/file2.css"></textarea>
      </div>

      <div id="npm-tab" style="display: none">
        <h3>输入 NPM 包信息：</h3>
        <textarea id="npm-input" placeholder="例如：
lodash@4.17.21
jquery@3.6.0"></textarea>
      </div>

      <button class="primary-btn" onclick="convertAll()">转换</button>
      <button class="secondary-btn" onclick="clearAll()">清空</button>

      <div id="result-container" class="result-container"></div>
    </div>

    <script>
      let currentTab = "github";

      function switchTab(tab) {
        document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
        document.querySelector(\`[onclick="switchTab('\${tab}')"]\`).classList.add("active");
        
        document.getElementById("github-tab").style.display = tab === "github" ? "block" : "none";
        document.getElementById("npm-tab").style.display = tab === "npm" ? "block" : "none";
        currentTab = tab;
      }

      async function validateUrl(url) {
        try {
          try {
            const directResponse = await fetch(url, { method: "HEAD" });
            return directResponse.ok;
          } catch (directError) {
            const workerUrls = [
              "/api/validate",
              "https://你的worker域名.workers.dev/api/validate",
            ];

            for (const workerUrl of workerUrls) {
              try {
                const response = await fetch(
                  \`\${workerUrl}?url=\${encodeURIComponent(url)}\`
                );
                if (response.ok) {
                  const data = await response.json();
                  return data.valid;
                }
              } catch (e) {
                continue;
              }
            }
          }
        } catch (error) {
          console.error("Validation error:", error);
        }
        return false;
      }

      function copyToClipboard(text, element) {
        navigator.clipboard.writeText(text).then(() => {
          const originalText = element.textContent;
          element.textContent = "已复制！";
          setTimeout(() => {
            element.textContent = originalText;
          }, 1000);
        });
      }

      async function convertGithubUrl(url) {
        const githubRegex = /github\\.com\\/([^\\/]+)\\/([^\\/]+)\\/blob\\/([^\\/]+)\\/(.+)/;
        const rawRegex = /raw\\.githubusercontent\\.com\\/([^\\/]+)\\/([^\\/]+)\\/(?:refs\\/heads\\/)?([^\\/]+)\\/(.+)/;
        
        let match = url.match(githubRegex);
        if (!match) {
          match = url.match(rawRegex);
          if (!match) {
            return { error: "无效的 GitHub 链接格式" };
          }
        }

        const [_, user, repo, branch, path] = match;
        const cdnUrl = \`https://cdn.jsdelivr.net/gh/\${user}/\${repo}@\${branch}/\${path}\`;
        
        const isValid = await validateUrl(cdnUrl);
        if (!isValid) {
          return { error: "链接验证失败，请确认资源是否存在" };
        }

        return { cdnUrl };
      }

      function convertNpmPackage(input) {
        const [packageName, version] = input.split("@");
        if (!packageName) {
          return { error: "无效的 NPM 包格式" };
        }
        const cdnUrl = version
          ? \`https://cdn.jsdelivr.net/npm/\${packageName}@\${version}\`
          : \`https://cdn.jsdelivr.net/npm/\${packageName}\`;
        return { cdnUrl };
      }

      async function convertAll() {
        const resultContainer = document.getElementById("result-container");
        resultContainer.innerHTML = "";

        const input = currentTab === "github"
          ? document.getElementById("github-input").value
          : document.getElementById("npm-input").value;

        const urls = input.split("\\n").filter((url) => url.trim());

        for (const url of urls) {
          const result = currentTab === "github"
            ? await convertGithubUrl(url.trim())
            : convertNpmPackage(url.trim());

          const resultItem = document.createElement("div");
          resultItem.className = "result-item";

          if (result.error) {
            resultItem.innerHTML = \`
              <div>
                <div class="url-info">原始链接: \${url}</div>
                <div class="error">\${result.error}</div>
              </div>
            \`;
          } else {
            resultItem.innerHTML = \`
              <div style="flex: 1">
                <div class="url-info">原始链接: \${url}</div>
                <div class="cdn-url">CDN 链接: \${result.cdnUrl}</div>
              </div>
              <button class="copy-btn" onclick="copyToClipboard('\${result.cdnUrl}', this)">复制</button>
            \`;
          }

          resultContainer.appendChild(resultItem);
        }
      }

      function clearAll() {
        document.getElementById("github-input").value = "";
        document.getElementById("npm-input").value = "";
        document.getElementById("result-container").innerHTML = "";
      }
    </script>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    // 处理 API 请求
    if (url.pathname === '/api/validate') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) {
        return new Response('Missing url parameter', { status: 400 });
      }

      try {
        const response = await fetch(targetUrl, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        return new Response(JSON.stringify({ valid: response.ok }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ valid: false }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 返回主页
    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}; 