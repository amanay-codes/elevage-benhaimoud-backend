"use strict";
const main = document.querySelector("main");
let mode = "production",
  language = localStorage.getItem("language") || "en",
  token = sessionStorage.getItem("token") || "",
  renderId = 0,
  adminKind = "horses",
  adminPage = 1;
const arabic = () => language === "ar";
const t = (en, ar) => (arabic() ? ar : en);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const localized = (item, key) =>
  arabic() && item[key + "Ar"] ? item[key + "Ar"] : item[key] || "";
const photo = (url) =>
  typeof url === "string" &&
  (/^(https?:\/\/|\/assets\/)/.test(url) ||
    /^data:image\/(jpeg|png|webp);base64,/.test(url))
    ? esc(url)
    : "/assets/atlas.jpg";
const toast = (message) => {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (el.style.display = "none"), 3500);
};
async function api(path, options = {}) {
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  if (options.body && !(options.body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const res = await fetch("/api" + path, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("The server returned an unexpected response.");
  }
  if (!res.ok) {
    if (res.status === 401 && path !== "/auth/login") {
      token = "";
      sessionStorage.removeItem("token");
    }
    throw new Error(data.message || "Request failed.");
  }
  return data;
}
const image = (url, alt, extra = "") =>
  `<img src="${photo(url)}" alt="${esc(alt)}" loading="lazy" ${extra}>`;
const empty = () =>
  `<div class="empty">${t("Nothing here yet. Check back soon.", "لا يوجد محتوى بعد.")}</div>`;
const eyebrow = (en, ar) => `<span class="eyebrow">${t(en, ar)}</span>`;
const date = (value) =>
  value
    ? new Date(value).toLocaleDateString(arabic() ? "ar-MA" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
function horseCard(h) {
  return `<a class="card" href="#/horses/${encodeURIComponent(h.slug)}"><div class="image-wrap">${image(h.coverImage?.url, localized(h, "name"))}<span class="badge">${esc(h.sex)}</span></div><div class="card-meta"><div><h3>${esc(localized(h, "name"))}</h3><p>${esc(h.breed)} · ${esc(h.color || "")} ${h.dateOfBirth ? "· " + new Date(h.dateOfBirth).getFullYear() : ""}</p></div><span class="card-arrow">↗</span></div></a>`;
}
function newsCard(n) {
  return `<a class="card journal-card" href="#/journal/${encodeURIComponent(n.slug)}"><div class="image-wrap">${image(n.coverImage?.url, localized(n, "title"))}</div><span class="eyebrow">${esc(n.category)} · ${date(n.publishedAt)}</span><h3>${esc(localized(n, "title"))}</h3><p>${esc(localized(n, "excerpt"))}</p><span class="text-link">${t("Read the story", "اقرأ القصة")} ↗</span></a>`;
}
function intro(label, title, copy) {
  return `<div class="intro"><span class="eyebrow">${label}</span><h1>${title}</h1><p>${copy}</p></div>`;
}
function pager(page, total) {
  return total > 1
    ? `<div class="pager"><button data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>← ${t("Previous", "السابق")}</button><span>${page} / ${total}</span><button data-page="${page + 1}" ${page >= total ? "disabled" : ""}>${t("Next", "التالي")} →</button></div>`
    : "";
}
async function home() {
  const [horses, news] = await Promise.all([
    api("/horses?isFeatured=true&limit=3"),
    api("/news?limit=3"),
  ]);
  return `<section class="hero"><img src="/assets/hero.jpg" alt="Horses in an open landscape" fetchpriority="high"><div class="hero-content">${eyebrow("Moroccan roots. A timeless passion.", "جذور مغربية. شغف خالد.")}<h1>${t("A legacy<br>in <em>motion.</em>", "إرثٌ<br>ينبض <em>بالحياة.</em>")}</h1><p>${t("Exceptional horses. Enduring connections. Discover a breeding journey guided by care, character, and a love for the Arabian horse.", "خيول استثنائية وروابط دائمة. اكتشف رحلة تربية يقودها الاهتمام والأصالة وحب الخيل العربي.")}</p><a class="button light" href="#/horses">${t("Meet our horses", "اكتشف خيولنا")} <span>↗</span></a></div><span class="hero-note">Élevage Benhaimoud · Morocco</span></section><div class="values"><span>${t("Rooted in passion", "شغف متأصل")}</span><span>${t("Raised with care", "رعاية باهتمام")}</span><span>${t("Looking to the future", "نحو المستقبل")}</span></div><section class="section"><div class="section-head"><div>${eyebrow("The heart of our story", "جوهر حكايتنا")}<h2>${t("Meet the horses.", "تعرّف على خيولنا.")}</h2></div><a class="text-link" href="#/horses">${t("Explore the collection", "جميع الخيول")} ↗</a></div><div class="grid">${horses.data.map(horseCard).join("") || empty()}</div></section><section class="story">${image("/assets/landscape.jpg", "Open fields and horses", 'class="story-photo"')}<div class="story-copy">${eyebrow("More than a breeding farm", "أكثر من مجرد مزرعة")}<h2>${t("A passion passed<br>from heart to heart.", "شغف ينتقل<br>من قلب إلى قلب.")}</h2><p>${t("At Élevage Benhaimoud, our story begins with a simple connection: the bond between people and horses. We believe the best journeys are built on patience, respect, and everyday care.", "تبدأ حكايتنا برابطة بسيطة بين الإنسان والخيل. نؤمن بأن أجمل الرحلات تُبنى على الصبر والاحترام والرعاية اليومية.")}</p><a class="text-link" href="#/about">${t("Discover our story", "اكتشف حكايتنا")} ↗</a></div></section><section class="section"><div class="section-head"><div>${eyebrow("Notes from the farm", "أخبار المزرعة")}<h2>${t("The journal.", "اليوميات.")}</h2></div><a class="text-link" href="#/journal">${t("All stories", "جميع الأخبار")} ↗</a></div><div class="grid">${news.data.map(newsCard).join("") || empty()}</div></section><section class="invitation">${eyebrow("A closer look", "نظرة أقرب")}<h2>${t("Every moment tells a story.", "كل لحظة تحكي قصة.")}</h2><p>${t("Step into our world, one photograph at a time.", "ادخل عالمنا، صورة تلو الأخرى.")}</p><a class="button light" href="#/gallery">${t("Visit the gallery", "معرض الصور")} ↗</a></section>`;
}
async function listing(kind, params) {
  const horses = kind === "horses" || kind === "stallions";
  const endpoint = horses ? "horses" : kind === "journal" ? "news" : "gallery";
  const query = new URLSearchParams(params);
  query.set("limit", "12");
  if (kind === "stallions") query.set("isStallion", "true");
  const result = await api(`/${endpoint}?${query}`);
  const title = {
    horses: t("Our horses.", "خيولنا."),
    stallions: t("Our stallions.", "فحولنا."),
    journal: t("The journal.", "اليوميات."),
    gallery: t("Life, in photographs.", "الحياة بالصور."),
  }[kind];
  const copy = horses
    ? t(
        "Meet the individual characters behind our breeding journey.",
        "تعرّف على الخيول التي تصنع حكايتنا.",
      )
    : t(
        "Stories and moments from the world of Élevage Benhaimoud.",
        "قصص ولحظات من عالم تربية بن حيمود.",
      );
  return (
    intro(t("Élevage Benhaimoud collection", "مجموعة بن حيمود"), title, copy) +
    `<section class="section listing"><form class="filters" id="filters"><input aria-label="Search" name="search" placeholder="${t("Search the collection…", "ابحث…")}" value="${esc(params.get("search") || "")}">${horses ? `<select name="sex" aria-label="Filter by sex"><option value="">${t("All horses", "كل الخيول")}</option>${["stallion", "mare", "gelding", "colt", "filly"].map((s) => `<option ${params.get("sex") === s ? "selected" : ""}>${s}</option>`).join("")}</select>` : `<select name="category" aria-label="Filter by category"><option value="">${t("All categories", "كل الفئات")}</option>${(kind === "journal" ? ["news", "event", "achievement", "sale", "birth"] : ["horses", "competitions", "farm", "foals", "training", "other"]).map((s) => `<option ${params.get("category") === s ? "selected" : ""}>${s}</option>`).join("")}</select>`}<button class="button" type="submit">${t("Filter", "تصفية")} ↗</button></form><div class="${kind === "gallery" ? "gallery-grid" : "grid"}">${result.data.map(horses ? horseCard : kind === "journal" ? newsCard : galleryCard).join("") || empty()}</div>${pager(Number(params.get("page") || 1), result.totalPages)}</section>`
  );
}
function galleryCard(g) {
  return `<figure class="gallery-item">${g.type === "video" ? `<video controls preload="metadata" src="${photo(g.url)}" aria-label="${esc(g.caption)}"></video>` : `<button data-lightbox="${photo(g.url)}" aria-label="Enlarge ${esc(localized(g, "caption"))}">${image(g.url, localized(g, "caption"))}</button>`}<figcaption>${esc(localized(g, "caption"))}</figcaption></figure>`;
}
async function horseDetail(slug) {
  const { data: h } = await api("/horses/" + encodeURIComponent(slug));
  const relatives = {
    sire: "Sire",
    dam: "Dam",
    paternalGrandsire: "Paternal grandsire",
    paternalGranddam: "Paternal granddam",
    maternalGrandsire: "Maternal grandsire",
    maternalGranddam: "Maternal granddam",
  };
  return `<article class="detail"><a class="back" href="#/horses">← ${t("Back to our horses", "العودة إلى الخيول")}</a><div class="detail-grid">${image(h.coverImage?.url, localized(h, "name"), 'class="detail-photo"')}<div>${eyebrow(esc(h.breed), esc(h.breedAr || h.breed))}<h1>${esc(localized(h, "name"))}</h1>${h.availableForBreeding ? `<span class="pill">${t("Available for breeding", "متاح للتزاوج")}</span>` : ""}<p>${esc(localized(h, "description"))}</p><div class="facts">${[
    ["Sex", h.sex],
    ["Born", date(h.dateOfBirth)],
    ["Colour", h.color],
    ["Status", h.status],
    ["Registration", h.registrationNumber],
  ]
    .filter((x) => x[1])
    .map(([k, v]) => `<div><small>${k}</small>${esc(v)}</div>`)
    .join(
      "",
    )}</div></div></div><section class="pedigree"><h2>${t("The pedigree", "النسب")}</h2><div class="pedigree-grid">${Object.entries(
    relatives,
  )
    .map(
      ([k, v]) =>
        `<div><small>${v}</small>${esc(localized(h.pedigree?.[k] || {}, "name") || "—")}</div>`,
    )
    .join(
      "",
    )}</div></section>${h.achievements?.length ? `<section class="pedigree"><h2>${t("Achievements", "الإنجازات")}</h2>${h.achievements.map((a) => `<p>${esc(a.year)} · ${esc(localized(a, "title"))} · ${esc(a.competition)} ${esc(a.rank)}</p>`).join("")}</section>` : ""}${h.images?.length ? `<section class="section"><div class="gallery-grid">${h.images.map(galleryCard).join("")}</div></section>` : ""}</article>`;
}
async function article(slug) {
  const { data: n } = await api("/news/" + encodeURIComponent(slug));
  return `<article class="article"><a class="back" href="#/journal">← ${t("Back to the journal", "العودة إلى اليوميات")}</a>${eyebrow(esc(n.category) + " · " + date(n.publishedAt), esc(n.category) + " · " + date(n.publishedAt))}<h1>${esc(localized(n, "title"))}</h1>${image(n.coverImage?.url, localized(n, "title"))}<div class="content">${esc(localized(n, "content"))}</div></article>`;
}
function about() {
  return (
    intro(
      t("Our story", "حكايتنا"),
      t("A life alongside horses.", "حياة إلى جانب الخيل."),
      t("Élevage Benhaimoud · Morocco", "تربية بن حيمود · المغرب"),
    ) +
    `<section class="story">${image("/assets/landscape.jpg", "Horses in the countryside", 'class="story-photo"')}<div class="story-copy">${eyebrow("Care. Character. Connection.", "رعاية. أصالة. تواصل.")}<h2>${t("The horse comes first.", "الخيل أولاً.")}</h2><p>${t("Our ambition is simple: to celebrate the Arabian horse and share the journey of raising each individual with care. This space brings together our horses, their pedigrees, and the everyday moments that shape our story.", "طموحنا بسيط: الاحتفاء بالخيل العربي ومشاركة رحلة تربية كل حصان بعناية. تجمع هذه المساحة خيولنا وأنسابها واللحظات اليومية التي تشكّل حكايتنا.")}</p><a class="button" href="#/horses">${t("Meet the horses", "اكتشف الخيول")} ↗</a>${mode === "demo" ? '<p class="help">Preview copy — add your real farm history and contact details before publishing.</p>' : ""}</div></section>`
  );
}
function login() {
  return `<section class="login"><span class="eyebrow">Élevage Benhaimoud</span><h1>Welcome back.</h1><p>Sign in to manage your horses, stories, and gallery.</p>${mode === "demo" ? '<p class="demo-login">Local demo login<br><strong>admin@demo.local</strong><br>Password: <strong>Benhaimoud2026!</strong><br>Use your new password if you have changed it.</p>' : ""}<form id="login"><label>Email<input name="email" type="email" autocomplete="username" required value="${mode === "demo" ? "admin@demo.local" : ""}"></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><p class="form-error" role="alert"></p><button class="button">Sign in ↗</button></form></section>`;
}
async function admin() {
  if (!token) return login();
  try {
    await api("/auth/me");
  } catch {
    return login();
  }
  const result = await api(
    `/${adminKind}${adminKind === "news" ? "/admin/all" : ""}?limit=20&page=${adminPage}`,
  );
  return `<section class="admin"><div class="admin-header"><div><span class="eyebrow">Your breeding journal, organised</span><h1>The dashboard.</h1><p>${mode === "demo" ? "Local preview · Your changes are saved on this computer." : "Manage the content of your website."}</p></div><div><button class="button outline" id="password-button">Change password</button> <button class="button outline" id="logout">Sign out</button></div></div><div class="tabs" role="tablist">${["horses", "news", "gallery"].map((k) => `<button role="tab" aria-selected="${adminKind === k}" class="${adminKind === k ? "selected" : ""}" data-tab="${k}">${{ horses: "Horses", news: "Journal", gallery: "Gallery" }[k]}</button>`).join("")}</div><div id="editor"></div><div class="admin-toolbar"><span>${result.total ?? result.data.length} ${adminKind === "news" ? "articles" : adminKind}</span><button class="button" id="add">+ Add ${adminKind === "horses" ? "horse" : adminKind === "news" ? "article" : "media"}</button></div><div class="table-wrap"><table><thead><tr><th>Name / title</th><th>Category</th><th>Status</th><th>Manage</th></tr></thead><tbody>${result.data.map((x) => `<tr><td><div class="table-title">${image(x.coverImage?.url || x.url, x.name || x.title || x.caption)}<span>${esc(x.name || x.title || x.caption || "Untitled")}</span></div></td><td>${esc(x.breed || x.category)}</td><td><span class="pill ${adminKind === "news" && !x.isPublished ? "draft" : ""}">${adminKind === "news" ? (x.isPublished ? "Published" : "Draft") : esc(x.status || x.type)}</span></td><td><div class="row-actions"><button data-edit="${esc(x._id)}">Edit</button><button class="danger" data-delete="${esc(x._id)}">Delete</button></div></td></tr>`).join("") || '<tr><td colspan="4">No records yet. Add your first one above.</td></tr>'}</tbody></table></div>${pager(adminPage, result.totalPages)}</section>`;
}
function field(name, label, value = "", type = "text", required = false) {
  return `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${required ? "required" : ""} ${type === "text" ? 'maxlength="200"' : ""}></label>`;
}
function area(name, label, value = "", required = false) {
  return `<label class="full">${label}<textarea aria-label="${esc(label)}" name="${name}" ${required ? "required" : ""} maxlength="50000">${esc(value)}</textarea></label>`;
}
function select(name, label, value, values) {
  return `<label>${label}<select name="${name}">${values.map((v) => `<option value="${v}" ${v === value ? "selected" : ""}>${v}</option>`).join("")}</select></label>`;
}
function check(name, label, value) {
  return `<label class="check"><input type="checkbox" name="${name}" ${value ? "checked" : ""}>${label}</label>`;
}
async function editRecord(id) {
  let item = {};
  if (id) item = (await api("/" + adminKind + "/admin/" + id)).data;
  const host = document.querySelector("#editor");
  const isHorse = adminKind === "horses",
    isNews = adminKind === "news";
  host.innerHTML = `<form class="editor" id="record-form"><h2>${id ? "Edit" : "Add"} ${isHorse ? "horse" : isNews ? "article" : "media"}</h2><div class="form-grid">${
    isHorse
      ? field("name", "Name", item.name, "text", true) +
        field("nameAr", "Arabic name", item.nameAr) +
        field("breed", "Breed", item.breed || "Arabian", "text", true) +
        field("breedAr", "Arabic breed", item.breedAr) +
        select("sex", "Sex", item.sex || "stallion", [
          "stallion",
          "mare",
          "gelding",
          "colt",
          "filly",
        ]) +
        field(
          "dateOfBirth",
          "Date of birth",
          item.dateOfBirth?.slice(0, 10),
          "date",
        ) +
        field("color", "Colour", item.color) +
        select("status", "Status", item.status || "active", [
          "active",
          "sold",
          "retired",
          "deceased",
        ]) +
        area("description", "Description", item.description) +
        area("descriptionAr", "Arabic description", item.descriptionAr) +
        check("isFeatured", "Featured on homepage", item.isFeatured) +
        check("isStallion", "Show on stallions page", item.isStallion) +
        check(
          "availableForBreeding",
          "Available for breeding",
          item.availableForBreeding,
        ) +
        `<h3 class="full">Pedigree</h3>${[
          ["sire", "Sire"],
          ["dam", "Dam"],
          ["paternalGrandsire", "Paternal grandsire"],
          ["paternalGranddam", "Paternal granddam"],
          ["maternalGrandsire", "Maternal grandsire"],
          ["maternalGranddam", "Maternal granddam"],
        ]
          .map(([k, v]) => field("pedigree_" + k, v, item.pedigree?.[k]?.name))
          .join("")}`
      : isNews
        ? field("title", "Title", item.title, "text", true) +
          field("titleAr", "Arabic title", item.titleAr) +
          select("category", "Category", item.category || "news", [
            "news",
            "event",
            "achievement",
            "sale",
            "birth",
          ]) +
          check(
            "isPublished",
            "Published (visible to visitors)",
            item.isPublished,
          ) +
          area(
            "excerpt",
            "Short summary (maximum 300 characters)",
            item.excerpt,
          ) +
          area("excerptAr", "Arabic summary", item.excerptAr) +
          area("content", "Article text", item.content, true) +
          area("contentAr", "Arabic article text", item.contentAr)
        : field("caption", "Caption", item.caption) +
          field("captionAr", "Arabic caption", item.captionAr) +
          select("category", "Category", item.category || "horses", [
            "horses",
            "competitions",
            "farm",
            "foals",
            "training",
            "other",
          ]) +
          check("isFeatured", "Featured", item.isFeatured)
  }<div class="full"><h3>${isHorse || isNews ? "Cover image" : "Media"}</h3>${item.coverImage?.url || item.url ? image(item.coverImage?.url || item.url, "Current image", 'class="image-preview"') : ""}${!id || isHorse || isNews ? `<label>${mode === "demo" ? "Photo (JPG, PNG or WebP, up to 5 MB)" : "Upload a file (images up to 5 MB; gallery video up to 25 MB)"}<input type="file" name="upload" accept="${!isHorse && !isNews && mode !== "demo" ? "image/jpeg,image/png,image/webp,video/mp4,video/webm" : "image/jpeg,image/png,image/webp"}"></label>` : ""}${mode === "demo" ? field("imageUrl", "Or HTTPS image URL", item.coverImage?.url?.startsWith("https:") ? item.coverImage.url : item.url?.startsWith("https:") ? item.url : "", "url") : ""}<p class="help">Only use photographs you own or have permission to publish.${mode === "demo" ? " Demo mode supports photos; cloud mode also supports gallery videos." : ""}</p></div></div><p class="form-error" role="alert"></p><div class="form-actions"><button class="button" type="submit">Save ${isHorse ? "horse" : isNews ? "article" : "media"} ↗</button><button class="button outline" type="button" id="cancel">Cancel</button></div></form>`;
  document.querySelector("#cancel").onclick = () => host.replaceChildren();
  host.scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelector("#record-form").onsubmit = async (event) => {
    event.preventDefault();
    const form = event.target,
      button = form.querySelector("[type=submit]");
    button.disabled = true;
    const values = new FormData(form),
      body = {};
    for (const [key, value] of values)
      if (!["upload", "imageUrl"].includes(key) && !key.startsWith("pedigree_"))
        body[key] = value;
    for (const key of [
      "isFeatured",
      "isStallion",
      "availableForBreeding",
      "isPublished",
    ])
      if (form.elements[key]) body[key] = form.elements[key].checked;
    if (isHorse) {
      body.pedigree = { ...item.pedigree };
      for (const [key, value] of values)
        if (key.startsWith("pedigree_")) {
          const relative = key.slice(9);
          if (value.trim())
            body.pedigree[relative] = {
              ...item.pedigree?.[relative],
              name: value.trim(),
            };
          else delete body.pedigree[relative];
        }
    }
    try {
      if (
        (body.excerpt || "").length > 300 ||
        (body.excerptAr || "").length > 300
      )
        throw new Error("Summaries must be 300 characters or fewer.");
      const file = values.get("upload");
      let requestBody;
      if (mode === "demo") {
        let url = values.get("imageUrl") || item.coverImage?.url || item.url;
        if (file?.size) {
          if (file.size > 5 * 1024 * 1024)
            throw new Error("Please choose an image smaller than 5 MB.");
          url = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () =>
              reject(new Error("Could not read this image."));
            reader.readAsDataURL(file);
          });
        }
        if (url) {
          if (isHorse || isNews) body.coverImage = { url };
          else body.url = url;
        }
        requestBody = JSON.stringify(body);
      } else {
        requestBody = new FormData();
        for (const [key, value] of Object.entries(body))
          requestBody.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : String(value),
          );
        if (file?.size)
          requestBody.append(isHorse || isNews ? "coverImage" : "media", file);
        if (adminKind === "gallery" && id) requestBody = JSON.stringify(body);
      }
      await api("/" + adminKind + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        body: requestBody,
      });
      toast("Saved successfully.");
      await render();
    } catch (error) {
      form.querySelector(".form-error").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  };
}
function passwordForm() {
  document.querySelector("#editor").innerHTML =
    `<form class="editor" id="password-form"><h2>Change password</h2><label>Current password<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>New password (12 characters minimum)<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="256" required></label><p class="form-error" role="alert"></p><div class="form-actions"><button class="button">Update password</button><button type="button" class="button outline" id="cancel">Cancel</button></div></form>`;
  document.querySelector("#cancel").onclick = () =>
    document.querySelector("#editor").replaceChildren();
  document.querySelector("#password-form").onsubmit = async (e) => {
    e.preventDefault();
    const button = e.target.querySelector("button");
    button.disabled = true;
    try {
      await api("/auth/password", {
        method: "PUT",
        body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
      });
      token = "";
      sessionStorage.removeItem("token");
      toast("Password updated. Please sign in again.");
      render();
    } catch (error) {
      e.target.querySelector(".form-error").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  };
}
function bind() {
  const form = document.querySelector("#filters");
  if (form)
    form.onsubmit = (e) => {
      e.preventDefault();
      const params = new URLSearchParams();
      for (const [k, v] of new FormData(form)) if (v) params.set(k, v);
      location.hash = location.hash.split("?")[0] + "?" + params;
    };
  document.querySelectorAll("[data-page]").forEach(
    (b) =>
      (b.onclick = () => {
        if (location.hash.startsWith("#/admin")) {
          adminPage = Number(b.dataset.page);
          render();
          return;
        }
        const [route, q] = location.hash.split("?");
        const params = new URLSearchParams(q);
        params.set("page", b.dataset.page);
        location.hash = route + "?" + params;
      }),
  );
  document.querySelectorAll("[data-lightbox]").forEach(
    (b) =>
      (b.onclick = () => {
        const dialog = document.createElement("dialog");
        dialog.innerHTML = `<button aria-label="Close photograph">×</button>${image(b.dataset.lightbox, b.getAttribute("aria-label"))}`;
        document.body.append(dialog);
        dialog.querySelector("button").onclick = () => dialog.close();
        dialog.onclose = () => dialog.remove();
        dialog.showModal();
      }),
  );
  const loginForm = document.querySelector("#login");
  if (loginForm)
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const button = loginForm.querySelector("button");
      button.disabled = true;
      try {
        const data = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(new FormData(loginForm))),
        });
        token = data.token;
        sessionStorage.setItem("token", token);
        render();
      } catch (error) {
        loginForm.querySelector(".form-error").textContent = error.message;
      } finally {
        button.disabled = false;
      }
    };
  document.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        adminKind = b.dataset.tab;
        adminPage = 1;
        render();
      }),
  );
  const logout = document.querySelector("#logout");
  if (logout)
    logout.onclick = async () => {
      try {
        await api("/auth/logout", { method: "POST" });
      } catch {}
      token = "";
      sessionStorage.removeItem("token");
      render();
    };
  const add = document.querySelector("#add");
  if (add) add.onclick = () => editRecord().catch((e) => toast(e.message));
  document
    .querySelectorAll("[data-edit]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          editRecord(b.dataset.edit).catch((e) => toast(e.message))),
    );
  document.querySelectorAll("[data-delete]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (!confirm("Delete this record? This cannot be undone.")) return;
        b.disabled = true;
        try {
          await api("/" + adminKind + "/" + b.dataset.delete, {
            method: "DELETE",
          });
          toast("Record deleted.");
          render();
        } catch (error) {
          toast(error.message);
          b.disabled = false;
        }
      }),
  );
  const password = document.querySelector("#password-button");
  if (password) password.onclick = passwordForm;
}
async function render() {
  const current = ++renderId;
  const [route, query] = (location.hash.slice(1) || "/").split("?");
  const parts = route.split("/").filter(Boolean);
  const page = parts[0] || "home";
  document.documentElement.lang = language;
  document.documentElement.dir = arabic() ? "rtl" : "ltr";
  document.querySelector("#language").textContent = arabic()
    ? "English"
    : "العربية";
  document.querySelectorAll("[data-nav]").forEach((a) => {
    a.classList.toggle("active", a.dataset.nav === page);
    const labels = {
      home: ["Home", "الرئيسية"],
      horses: ["Our horses", "خيولنا"],
      stallions: ["Stallions", "الفحول"],
      journal: ["Journal", "اليوميات"],
      gallery: ["Gallery", "المعرض"],
      about: ["Our story", "حكايتنا"],
    };
    a.textContent = labels[a.dataset.nav][arabic() ? 1 : 0];
  });
  document.title = `${{ home: "A legacy in motion", horses: "Our horses", stallions: "Stallions", journal: "Journal", gallery: "Gallery", about: "Our story", admin: "Dashboard" }[page] || "Page"} | Élevage Benhaimoud`;
  main.innerHTML =
    '<div class="loading" role="status">' +
    t("Loading…", "جار التحميل…") +
    "</div>";
  try {
    let html;
    if (page === "home") html = await home();
    else if (page === "horses" && parts[1])
      html = await horseDetail(decodeURIComponent(parts[1]));
    else if (page === "journal" && parts[1])
      html = await article(decodeURIComponent(parts[1]));
    else if (["horses", "stallions", "journal", "gallery"].includes(page))
      html = await listing(page, new URLSearchParams(query));
    else if (page === "about") html = about();
    else if (page === "admin") html = await admin();
    else
      html =
        '<div class="empty"><h1>Page not found</h1><a class="button" href="#/">Back home</a></div>';
    if (current !== renderId) return;
    main.innerHTML = html;
    bind();
  } catch (error) {
    if (current === renderId) {
      main.innerHTML = `<div class="error"><h2>${t("We couldn’t load this page.", "تعذر تحميل الصفحة.")}</h2><p>${esc(error.message)}</p><button class="button" id="retry">Try again</button></div>`;
      document.querySelector("#retry").onclick = render;
    }
  }
}
document.querySelector("#language").onclick = () => {
  language = arabic() ? "en" : "ar";
  localStorage.setItem("language", language);
  render();
};
document.querySelector(".menu-toggle").onclick = (e) => {
  const open = document.querySelector("#navigation").classList.toggle("open");
  e.currentTarget.setAttribute("aria-expanded", String(open));
};
window.addEventListener("hashchange", () => {
  document.querySelector("#navigation").classList.remove("open");
  document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
  window.scrollTo(0, 0);
  render();
});
document.querySelector("#year").textContent = new Date().getFullYear();
api("/health")
  .then((data) => {
    mode = data.mode || "production";
    document.querySelector("#preview").hidden = mode !== "demo";
  })
  .catch(() => {})
  .finally(render);
