document.addEventListener('DOMContentLoaded', async () => {
  const accountsDiv = document.getElementById('accounts');
  const newTokenInput = document.getElementById('newToken');
  const addAndLoginBtn = document.getElementById('addAndLoginBtn');
  const addOnlyBtn = document.getElementById('addOnlyBtn');
  const exportBtn = document.getElementById('exportBtn');

  const DEFAULT_AVATAR = 'https://discord.com/assets/18e336a74a159cfd.png';

  async function loadAccounts() {
    accountsDiv.innerHTML = '';
    const data = await chrome.storage.sync.get('accounts');
    const accounts = data.accounts || [];

    accounts.forEach((acc, index) => {
      const div = document.createElement('div');
      div.className = 'account';

      const img = document.createElement('img');
      img.className = 'avatar';
      img.src = acc.avatar ? `${acc.avatar}?size=64` : DEFAULT_AVATAR;
      img.onerror = () => { img.src = DEFAULT_AVATAR; };
      div.appendChild(img);

      const info = document.createElement('div');
      info.className = 'account-info';

      const h3 = document.createElement('h3');
      h3.textContent = acc.global_name || acc.username;
      info.appendChild(h3);

      const p = document.createElement('p');
      p.textContent = `@${acc.username}`;

      info.appendChild(p);
      div.appendChild(info);

      const loginBtn = document.createElement('button');
      loginBtn.className = 'login-btn';
      loginBtn.textContent = 'Login';
      loginBtn.title = 'Login';
      loginBtn.onclick = () => switchToAccount(acc.token);
      div.appendChild(loginBtn);

      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'delete-btn';
      logoutBtn.title = 'Logout';
      logoutBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;
      logoutBtn.onclick = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].url.includes('discord.com')) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: () => { localStorage.removeItem('token'); location.reload(); }
            });
          }
        });
      };
      div.appendChild(logoutBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.title = 'Delete';
      deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
      deleteBtn.onclick = async () => {
        let currentAccounts = (await chrome.storage.sync.get('accounts')).accounts || [];
        currentAccounts.splice(index, 1);
        await chrome.storage.sync.set({ accounts: currentAccounts });
        await loadAccounts();
      };
      div.appendChild(deleteBtn);

      accountsDiv.appendChild(div);
    });
  }

  await loadAccounts();

  addAndLoginBtn.addEventListener('click', () => fetchAndAddToken(true));
  addOnlyBtn.addEventListener('click', () => fetchAndAddToken(false));

  exportBtn.addEventListener('click', async () => {
    const accounts = (await chrome.storage.sync.get('accounts')).accounts || [];
    if (!accounts.length) return;
    await navigator.clipboard.writeText(accounts.map(a => a.token).join('\n'));
    exportBtn.textContent = 'Copied';
    setTimeout(() => { exportBtn.textContent = 'Export'; }, 1500);
  });

  async function fetchTokenFromLocalStorage() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].url.includes('discord.com')) {
          resolve(null);
          return;
        }

        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            const token = localStorage.getItem('token');
            return token ? JSON.parse(token) : null;
          }
        }, (result) => {
          if (result && result[0]) {
            resolve(result[0].result);
          } else {
            resolve(null);
          }
        });
      });
    });
  }

  async function fetchAndAddToken(shouldLogin = true) {
    let raw = (newTokenInput.value || '').trim();
    if (!raw) {
      raw = (await fetchTokenFromLocalStorage()) || '';
    }
    if (!raw) return;

    const tokens = [...new Set(
      raw.split(/\s+/)
        .map(t => t.replace(/^["']+|["']+$/g, ''))
        .filter(Boolean)
    )];

    const valid = [];
    for (const token of tokens) {
      const user = await validateToken(token);
      if (user) valid.push({ token, user });
    }
    if (!valid.length) return;

    let currentAccounts = (await chrome.storage.sync.get('accounts')).accounts || [];
    for (const { token, user } of valid) {
      const account = {
        token,
        username: user.username,
        global_name: user.global_name || user.username,
        avatar: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
          : null,
        nitro: user.premium_type && user.premium_type > 0,
        hypesquad: user.public_flags && (
          (user.public_flags & 64) ||
          (user.public_flags & 128) ||
          (user.public_flags & 256)
        )
      };
      currentAccounts = currentAccounts.filter(acc => acc.token !== token);
      currentAccounts.push(account);
    }
    await chrome.storage.sync.set({ accounts: currentAccounts });

    newTokenInput.value = '';

    await loadAccounts();

    if (shouldLogin) {
      switchToAccount(valid[0].token);
    }
  }

  async function validateToken(token) {
    try {
      const response = await fetch('https://discord.com/api/v9/users/@me', {
        headers: { 'Authorization': token }
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function switchToAccount(token) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let activeTab = tabs[0];

      if (activeTab && activeTab.url.includes('discord.com')) {
        injectToken(activeTab.id, token);
      } else {
        chrome.tabs.create({ url: 'https://discord.com/channels/@me' }, (newTab) => {
          setTimeout(() => injectToken(newTab.id, token), 3000);
        });
      }
    });
  }

  function injectToken(tabId, token) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (tok) => {
        localStorage.setItem('token', JSON.stringify(tok));
        location.reload();
      },
      args: [token]
    });
  }
});