// PROJECT 2 – LOCAL FAVORITES TRACKER
// Handles adding, rendering, searching, filtering, and deleting favorites.

console.log("app.js loaded"); // quick sanity check

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM ready");

  var form = document.getElementById("add-favorite-form");
  var nameInput = document.getElementById("name");
  var categoryInput = document.getElementById("category");
  var ratingInput = document.getElementById("rating");
  var notesInput = document.getElementById("notes");

  var favoritesList = document.getElementById("favorites-list");
  var searchInput = document.getElementById("search-input");
  var categoryFilter = document.getElementById("category-filter");

  if (!form || !favoritesList) {
    console.warn("Favorites tracker: required elements not found on this page.");
    return;
  }

  // -------- STATE & STORAGE --------
  var favorites = loadFavorites();

  function loadFavorites() {
    try {
      var raw = localStorage.getItem("local-favorites-data");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Error loading favorites from localStorage", e);
      return [];
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem("local-favorites-data", JSON.stringify(favorites));
    } catch (e) {
      console.error("Error saving favorites to localStorage", e);
    }
  }

  // -------- RENDERING --------
  function renderFavorites(listToRender) {
    favoritesList.innerHTML = "";

    if (!listToRender || listToRender.length === 0) {
      var empty = document.createElement("p");
      empty.className = "empty-message";
      empty.textContent = "No favorites yet — add some above!";
      favoritesList.appendChild(empty);
      return;
    }

    listToRender.forEach(function (fav) {
      var card = document.createElement("article");
      card.className = "favorite-card";
      card.setAttribute("data-id", fav.id);

      var ratingLabel = fav.ratingText || "";
      var dateLabel = fav.dateAdded || "";

      var headerHtml =
        '<div class="favorite-header">' +
        "<h3>" + escapeHTML(fav.name) + "</h3>" +
        '<span class="favorite-category">' +
        formatCategory(fav.category) +
        "</span>" +
        "</div>";

      var ratingHtml = ratingLabel
        ? '<div class="favorite-rating">' + ratingLabel + "</div>"
        : "";

      var notesHtml = fav.notes
        ? '<p class="favorite-notes">' + escapeHTML(fav.notes) + "</p>"
        : "";

      var dateHtml = dateLabel
        ? '<p class="favorite-date">Added on ' + dateLabel + "</p>"
        : "";

      var actionsHtml =
        '<div class="favorite-actions">' +
        '<button class="btn btn-danger delete-btn" type="button" data-id="' + fav.id + '">' +
        "Delete" +
        "</button>" +
        "</div>";

      card.innerHTML = headerHtml + ratingHtml + notesHtml + dateHtml + actionsHtml;

      favoritesList.appendChild(card);
    });
  }

  function formatCategory(cat) {
    switch (cat) {
      case "coffee":
        return "Coffee Shop";
      case "restaurants":
        return "Restaurant";
      case "parks":
        return "Park";
      case "entertainment":
        return "Entertainment";
      case "study-spots":
        return "Study Spot";
      case "fitness":
        return "Fitness";
      case "other":
        return "Other";
      default:
        return cat || "Uncategorized";
    }
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // -------- FILTERS (SEARCH + CATEGORY) --------
  function applyFilters() {
    var searchTerm = (searchInput ? searchInput.value : "").toLowerCase().trim();
    var categoryValue = categoryFilter ? categoryFilter.value : "all";

    var filtered = favorites.filter(function (fav) {
      var matchesCategory =
        categoryValue === "all" || fav.category === categoryValue;

      var text =
        (fav.name || "") +
        " " +
        (fav.notes || "") +
        " " +
        formatCategory(fav.category);

      var matchesSearch = text.toLowerCase().includes(searchTerm);

      return matchesCategory && matchesSearch;
    });

    renderFavorites(filtered);
  }

  // -------- FORM SUBMIT: ADD FAVORITE --------
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    console.log("Form submitted");

    var nameValue = nameInput.value.trim();
    var categoryValue = categoryInput.value;
    var ratingValue = ratingInput.value;
    var ratingText = ratingInput.options[ratingInput.selectedIndex].text;
    var notesValue = notesInput.value.trim();

    if (!nameValue || !categoryValue) {
      alert("Please fill out the required fields: Place Name and Category.");
      return;
    }

    var newFavorite = {
      id: Date.now().toString(),
      name: nameValue,
      category: categoryValue,
      rating: ratingValue,
      ratingText: ratingText,
      notes: notesValue,
      dateAdded: new Date().toLocaleDateString()
    };

    favorites.push(newFavorite);
    saveFavorites();
    applyFilters(); // re-render with current filters

    form.reset();
  });

  // -------- DELETE FAVORITE (EVENT DELEGATION) --------
  favoritesList.addEventListener("click", function (event) {
    var target = event.target;
    if (target.classList.contains("delete-btn")) {
      var id = target.getAttribute("data-id");
      favorites = favorites.filter(function (fav) {
        return fav.id !== id;
      });
      saveFavorites();
      applyFilters();
    }
  });

  // -------- SEARCH & FILTER LISTENERS --------
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", applyFilters);
  }

  // Initial render
  applyFilters();
});
