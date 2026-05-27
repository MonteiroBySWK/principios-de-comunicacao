const deck = document.getElementById("deck");
const statusEl = document.getElementById("status");
const navCounter = document.getElementById("nav-counter");
const navButtons = document.querySelectorAll("[data-dir]");

let slideElements = [];
let currentIndex = 0;
const baseUrl = import.meta.env.BASE_URL || "/";
const dataUrl = new URL("data/slides.json", baseUrl).toString();

const createText = (text, className, tag = "p") => {
  if (!text) return null;
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
};

const createList = (items) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const list = document.createElement("ul");
  list.className = "slide__list";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
  return list;
};

const createMedia = (image) => {
  if (!image) return null;
  const figure = document.createElement("figure");
  figure.className = "slide__media";
  const img = document.createElement("img");
  img.src = image;
  img.alt = "Imagem do slide";
  img.loading = "lazy";
  figure.appendChild(img);
  return figure;
};

const setStatus = (message) => {
  if (!statusEl) return;
  statusEl.textContent = message;
};

const updateCounter = () => {
  if (!navCounter) return;
  navCounter.textContent = `${currentIndex + 1} / ${slideElements.length}`;
};

const activateSlide = (nextIndex, shouldScroll = true) => {
  if (!slideElements.length) return;
  if (nextIndex < 0 || nextIndex >= slideElements.length) return;

  slideElements[currentIndex].classList.remove("slide--active");
  currentIndex = nextIndex;
  const active = slideElements[currentIndex];
  active.classList.add("slide--active");
  updateCounter();

  if (shouldScroll) {
    active.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  history.replaceState(null, "", `#${active.id}`);
};

const buildSlide = (slide, index, total, deckFooter) => {
  const section = document.createElement("section");
  section.className = "slide";
  section.id = `slide-${index + 1}`;

  if (slide.layout) {
    section.classList.add(`slide--${slide.layout}`);
  }

  const body = document.createElement("div");
  body.className = "slide__body";

  const eyebrow = createText(slide.eyebrow, "slide__eyebrow");
  const title = createText(slide.title, "slide__title", "h2");
  const subtitle = createText(slide.subtitle, "slide__subtitle", "h3");
  const text = createText(slide.text, "slide__text");
  const list = createList(slide.bullets);

  if (eyebrow) body.appendChild(eyebrow);
  if (title) body.appendChild(title);
  if (subtitle) body.appendChild(subtitle);
  if (text) body.appendChild(text);
  if (list) body.appendChild(list);

  const columns = document.createElement("div");
  columns.className = "slide__columns";
  const media = createMedia(slide.image);

  if (media && slide.layout === "two-column") {
    columns.appendChild(body);
    columns.appendChild(media);
    section.appendChild(columns);
  } else {
    section.appendChild(body);
    if (media) section.appendChild(media);
  }

  const footer = document.createElement("footer");
  footer.className = "slide__footer";
  const footerText = document.createElement("span");
  footerText.innerHTML = slide.footer || deckFooter || "";
  const pageText = document.createElement("span");
  pageText.innerHTML = `<strong>${index + 1}</strong> / ${total}`;
  footer.appendChild(footerText);
  footer.appendChild(pageText);
  section.appendChild(footer);

  return section;
};

const loadSlides = async () => {
  try {
    setStatus("Carregando conteudo do deck...");
    const response = await fetch(dataUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Erro ao carregar dados: ${response.status}`);
    }

    const payload = await response.json();
    const slides = payload.slides || [];

    if (!slides.length) {
      setStatus("Nenhum slide encontrado no data/slides.json.");
      return;
    }

    deck.innerHTML = "";
    slides.forEach((slide, index) => {
      const section = buildSlide(slide, index, slides.length, payload.footer);
      deck.appendChild(section);
    });

    slideElements = Array.from(deck.querySelectorAll(".slide"));
    setStatus("");
    activateFromHash();
  } catch (error) {
    console.error(error);
    setStatus(
      "Falha ao carregar os slides. Use um servidor local para evitar bloqueios do navegador."
    );
  }
};

const activateFromHash = () => {
  const hash = window.location.hash.replace("#", "");
  const index = slideElements.findIndex((slide) => slide.id === hash);
  slideElements.forEach((slide) => slide.classList.remove("slide--active"));
  currentIndex = index >= 0 ? index : 0;
  if (slideElements[currentIndex]) {
    slideElements[currentIndex].classList.add("slide--active");
  }
  updateCounter();
};

const handleNav = (direction) => {
  const delta = direction === "next" ? 1 : -1;
  activateSlide(currentIndex + delta);
};

navButtons.forEach((button) => {
  button.addEventListener("click", () => handleNav(button.dataset.dir));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "PageDown") {
    event.preventDefault();
    handleNav("next");
  }
  if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    handleNav("prev");
  }
});

window.addEventListener("hashchange", activateFromHash);
loadSlides();
