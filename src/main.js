import { GitTutorial } from "./GitTutorial.js";
import { loadLessons } from "./lessonsLoader.js";

document.addEventListener("DOMContentLoaded", async () => {
  const banner = document.getElementById("constructionBanner");
  const bannerClose = document.getElementById("constructionBannerClose");
  if (banner && bannerClose) {
    bannerClose.addEventListener("click", () => {
      banner.classList.add("hidden");
    });
  }

  try {
    const { lessons, totalLessons } = await loadLessons();
    new GitTutorial({ lessons, totalLessons });
  } catch (e) {
    // Fallback: start with empty lessons to avoid hard failure
    console.error("Failed to load lessons:", e);
    new GitTutorial({ lessons: {}, totalLessons: 0 });
  }
});
