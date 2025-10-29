const form = document.getElementById("shortenForm");
const longUrl = document.getElementById("longUrl");
const alias = document.getElementById("alias");
const domain = document.getElementById("domain");
const msg = document.getElementById("msg");
const result = document.getElementById("result");
const shortUrl = document.getElementById("shortUrl");
const copyBtn = document.getElementById("copyBtn");
const openBtn = document.getElementById("openBtn");
const year = document.getElementById("year");

year.textContent = new Date().getFullYear();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const long = longUrl.value.trim();
  if (!long.startsWith("http")) {
    msg.textContent = "URL harus diawali http:// atau https://";
    return;
  }
  msg.textContent = "Memproses...";

  const api = `https://${domain.value}/create.php?format=json&url=${encodeURIComponent(long)}${
    alias.value ? `&shorturl=${alias.value}` : ""
  }`;

  try {
    const res = await fetch(api);
    const data = await res.json();
    if (data.shorturl) {
      shortUrl.value = data.shorturl;
      openBtn.href = data.shorturl;
      msg.textContent = "Berhasil! Link dipendekkan.";
      result.classList.remove("hidden");
    } else {
      msg.textContent = data.errormessage || "Gagal memendekkan URL.";
      result.classList.add("hidden");
    }
  } catch (err) {
    msg.textContent = "Terjadi kesalahan. Coba lagi.";
    result.classList.add("hidden");
  }
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(shortUrl.value);
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
});// Helpers
function isValidUrl(str) {
  try {
    const u = new URL(str);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

function setMessage(text, isError = false) {
  els.msg.textContent = text ?? "";
  els.msg.style.color = isError ? "#dc2626" : "var(--muted)";
}

function makeApiUrl(base, longUrl, alias) {
  const apiHost = base === "v.gd" ? "https://v.gd" : "https://is.gd";
  const params = new URLSearchParams({ format: "json", url: longUrl });
  if (alias && alias.trim().length > 0) params.set("shorturl", alias.trim());
  return `${apiHost}/create.php?${params.toString()}`;
}

function setResult(shortlink) {
  els.shortUrl.value = shortlink;
  els.openBtn.href = shortlink;
  els.openBtn.textContent = "Buka";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=${encodeURIComponent(shortlink)}`;
  els.qrImage.src = qrUrl;
  els.downloadQR.href = qrUrl;
  els.resultSection.classList.remove("hidden");
}

function pushHistory(item) {
  const key = "loco_short_history";
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  list.unshift(item);
  localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
  renderHistory();
}

function renderHistory() {
  const key = "loco_short_history";
  const list = JSON.parse(localStorage.getItem(key) || "[]");

  if (!list.length) {
    els.historyList.classList.add("empty");
    els.historyList.innerHTML = `<p class="muted">Belum ada riwayat. Shorten link dulu ya 🙂</p>`;
    return;
  }

  els.historyList.classList.remove("empty");
  els.historyList.innerHTML = "";
  list.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div>
        <div><strong>${it.short}</strong> <span class="badge">${it.domain}</span></div>
        <div class="muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%">${it.long}</div>
      </div>
      <div class="actions-row">
        <button class="btn" data-act="copy" data-idx="${idx}">Copy</button>
        <a class="btn ghost" target="_blank" rel="noopener" href="${it.short}">Buka</a>
      </div>
      <button class="btn ghost" data-act="del" data-idx="${idx}" title="Hapus">✕</button>
    `;
    els.historyList.appendChild(row);
  });

  // Bind actions
  els.historyList.querySelectorAll("[data-act='copy']").forEach(btn => {
    btn.addEventListener("click", async e => {
      const idx = +e.currentTarget.dataset.idx;
      const list = JSON.parse(localStorage.getItem("loco_short_history") || "[]");
      const url = list[idx]?.short;
      if (url) {
        await navigator.clipboard.writeText(url);
        e.currentTarget.textContent = "Copied!";
        setTimeout(() => (e.currentTarget.textContent = "Copy"), 1200);
      }
    });
  });

  els.historyList.querySelectorAll("[data-act='del']").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = +e.currentTarget.dataset.idx;
      const list = JSON.parse(localStorage.getItem("loco_short_history") || "[]");
      list.splice(idx, 1);
      localStorage.setItem("loco_short_history", JSON.stringify(list));
      renderHistory();
    });
  });
}

// Events
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const longUrl = els.longUrl.value.trim();
  const alias = els.alias.value.trim();
  const domain = els.domain.value;

  if (!isValidUrl(longUrl)) {
    setMessage("Masukkan URL valid, wajib diawali http:// atau https://", true);
    return;
  }

  setMessage("Memproses…");
  els.shortenBtn?.setAttribute?.("disabled", "true");

  try {
    const apiUrl = makeApiUrl(domain, longUrl, alias);
    const res = await fetch(apiUrl, { method: "GET" });
    const data = await res.json();

    if (data?.shorturl) {
      setResult(data.shorturl);
      setMessage("Berhasil! Link sudah siap.");
      pushHistory({ long: longUrl, short: data.shorturl, domain });
    } else {
      const err = data?.errormessage || "Gagal memendekkan URL.";
      setMessage(err, true);
    }
  } catch (err) {
    console.error(err);
    setMessage("Terjadi kesalahan jaringan. Coba lagi.", true);
  } finally {
    els.shortenBtn?.removeAttribute?.("disabled");
  }
});

els.copyBtn.addEventListener("click", async () => {
  if (!els.shortUrl.value) return;
  await navigator.clipboard.writeText(els.shortUrl.value);
  els.copyBtn.textContent = "Copied!";
  setTimeout(() => (els.copyBtn.textContent = "Copy"), 1200);
});

els.clearBtn.addEventListener("click", () => {
  els.longUrl.value = "";
  els.alias.value = "";
  setMessage("");
  els.resultSection.classList.add("hidden");
});

els.clearHistory.addEventListener("click", () => {
  if (confirm("Hapus semua riwayat di perangkat ini?")) {
    localStorage.removeItem("loco_short_history");
    renderHistory();
  }
});

renderHistory();
