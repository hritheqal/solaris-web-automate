(function () {
  var categoryOptions = {
    yearly: ["Annual Preventive Maintenance", "System Health Summary", "Capacity Review"],
    "half-yearly": ["Mid-Year Preventive Maintenance", "Patch and Firmware Review", "Availability Review"],
    quarterly: ["Quarterly Health Check", "Log Review", "Performance Review"]
  };

  var state = {
    route: "workspace",
    screen: "selection",
    category: "",
    subcategory: "",
    files: []
  };

  var storageKey = "pm-report-system-history";

  var routes = {
    workspace: document.getElementById("workspace-view"),
    history: document.getElementById("history-view")
  };

  var selectionScreen = document.getElementById("selection-screen");
  var formScreen = document.getElementById("form-screen");
  var reportForm = document.getElementById("report-form");
  var logoInput = document.getElementById("company-logo");
  var logoName = document.getElementById("logo-name");
  var fileInput = document.getElementById("system-files");
  var dropZone = document.getElementById("drop-zone");
  var dropTitle = document.getElementById("drop-title");
  var fileList = document.getElementById("file-list");
  var historyList = document.getElementById("history-list");
  var toast = document.getElementById("toast");
  var clearHistoryButton = document.getElementById("clear-history");

  function setRoute(route) {
    state.route = route;

    Object.keys(routes).forEach(function (key) {
      routes[key].classList.toggle("is-active", key === route);
    });

    document.querySelectorAll(".nav-tab").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.route === route);
    });

    if (route === "history") {
      renderHistory();
    }
  }

  function showForm() {
    state.screen = "form";
    selectionScreen.hidden = true;
    formScreen.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showSelection() {
    state.screen = "selection";
    formScreen.hidden = true;
    selectionScreen.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getSelect(name) {
    return document.querySelector('[data-select="' + name + '"]');
  }

  function closeSelect(control) {
    if (!control) return;
    control.classList.remove("is-open");
    control.querySelector(".select-button").setAttribute("aria-expanded", "false");
    control.querySelector(".select-menu").hidden = true;
  }

  function closeAllSelects(except) {
    document.querySelectorAll(".select-control").forEach(function (control) {
      if (control !== except) {
        closeSelect(control);
      }
    });
  }

  function openSelect(control) {
    if (!control || control.classList.contains("is-disabled")) return;
    closeAllSelects(control);
    control.classList.add("is-open");
    control.querySelector(".select-button").setAttribute("aria-expanded", "true");
    control.querySelector(".select-menu").hidden = false;
  }

  function toggleSelect(control) {
    if (control.classList.contains("is-open")) {
      closeSelect(control);
    } else {
      openSelect(control);
    }
  }

  function setOption(name, value, text) {
    state[name] = value;
    document.getElementById(name + "-value").textContent = text;

    var control = getSelect(name);
    control.querySelectorAll('[role="option"]').forEach(function (option) {
      option.setAttribute("aria-selected", option.dataset.value === value ? "true" : "false");
    });

    closeSelect(control);

    if (name === "category") {
      resetSubcategory();
      if (value) {
        enableSubcategory(value);
      }
    }
  }

  function resetSubcategory() {
    state.subcategory = "";
    var control = getSelect("subcategory");
    var button = control.querySelector(".select-button");
    var menu = control.querySelector(".select-menu");

    control.classList.add("is-disabled");
    button.disabled = true;
    document.getElementById("subcategory-value").textContent = "Please choose the Category first";
    menu.innerHTML = "";
    closeSelect(control);
  }

  function enableSubcategory(category) {
    var control = getSelect("subcategory");
    var button = control.querySelector(".select-button");
    var menu = control.querySelector(".select-menu");
    var options = categoryOptions[category] || [];

    control.classList.remove("is-disabled");
    button.disabled = false;
    document.getElementById("subcategory-value").textContent = "Select Sub-Category";

    menu.innerHTML = "";
    appendOption(menu, "", "Select Sub-Category", true);
    options.forEach(function (label) {
      appendOption(menu, label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), label, false);
    });
  }

  function appendOption(menu, value, label, selected) {
    var option = document.createElement("button");
    option.type = "button";
    option.setAttribute("role", "option");
    option.dataset.value = value;
    option.setAttribute("aria-selected", selected ? "true" : "false");
    option.textContent = label;
    menu.appendChild(option);
  }

  function formatBytes(size) {
    if (!size && size !== 0) return "";
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
    return (size / (1024 * 1024)).toFixed(1) + " MB";
  }

  function addFiles(fileListObject) {
    var incoming = Array.prototype.slice.call(fileListObject || []);
    var existing = new Set(state.files.map(function (file) {
      return file.name + ":" + file.size + ":" + file.lastModified;
    }));

    incoming.forEach(function (file) {
      var id = file.name + ":" + file.size + ":" + file.lastModified;
      if (state.files.length < 200 && !existing.has(id)) {
        state.files.push(file);
        existing.add(id);
      }
    });

    renderFiles();
  }

  function removeFile(index) {
    state.files.splice(index, 1);
    renderFiles();
  }

  function renderFiles() {
    fileList.innerHTML = "";

    if (state.files.length > 0) {
      dropTitle.textContent = "Files added! Click or drag to append more...";
    } else {
      dropTitle.textContent = "Click to drag or attach files";
    }

    state.files.forEach(function (file, index) {
      var chip = document.createElement("div");
      chip.className = "file-chip";
      chip.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5"/></svg>' +
        '<span class="file-name"></span>' +
        '<span class="file-size"></span>' +
        '<button type="button" aria-label="Remove file">x</button>';
      chip.querySelector(".file-name").textContent = file.name;
      chip.querySelector(".file-size").textContent = "(" + formatBytes(file.size) + ")";
      chip.querySelector("button").addEventListener("click", function () {
        removeFile(index);
      });
      fileList.appendChild(chip);
    });
  }

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveHistory(record) {
    var history = getHistory();
    history.unshift(record);
    localStorage.setItem(storageKey, JSON.stringify(history.slice(0, 40)));
  }

  function renderHistory() {
    var history = getHistory();
    historyList.innerHTML = "";

    if (!history.length) {
      var empty = document.createElement("div");
      empty.className = "empty-history";
      empty.textContent = "No PM reports generated yet.";
      historyList.appendChild(empty);
      return;
    }

    history.forEach(function (item) {
      var entry = document.createElement("article");
      entry.className = "history-item";

      var details = document.createElement("div");
      var title = document.createElement("h2");
      var meta = document.createElement("p");
      var badge = document.createElement("div");

      title.textContent = item.companyName || "Untitled company";
      meta.textContent = [
        item.customer,
        item.categoryText,
        item.subcategoryText,
        item.fileCount + " file" + (item.fileCount === 1 ? "" : "s"),
        item.createdAt
      ].filter(Boolean).join(" | ");
      badge.className = "history-badge";
      badge.textContent = "Generated";

      details.appendChild(title);
      details.appendChild(meta);
      entry.appendChild(details);
      entry.appendChild(badge);
      historyList.appendChild(entry);
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 3200);
  }

  function getSelectedText(name) {
    return document.getElementById(name + "-value").textContent;
  }

  document.querySelectorAll("[data-route]").forEach(function (button) {
    button.addEventListener("click", function () {
      setRoute(button.dataset.route);
    });
  });

  document.querySelectorAll('[data-action="home"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      setRoute("workspace");
      showSelection();
    });
  });

  document.querySelector('[data-customer="solaris"]').addEventListener("click", showForm);

  document.querySelectorAll(".customer-card.is-disabled").forEach(function (button) {
    button.addEventListener("click", function () {
      showToast("This customer workspace is not enabled yet.");
    });
  });

  document.querySelector('[data-action="back"]').addEventListener("click", showSelection);

  document.querySelectorAll(".select-control").forEach(function (control) {
    var button = control.querySelector(".select-button");
    var name = control.dataset.select;

    button.addEventListener("click", function () {
      toggleSelect(control);
    });

    control.querySelector(".select-menu").addEventListener("click", function (event) {
      var option = event.target.closest('[role="option"]');
      if (!option) return;
      setOption(name, option.dataset.value, option.textContent);
    });
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".select-control")) {
      closeAllSelects();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAllSelects();
    }
  });

  logoInput.addEventListener("change", function () {
    logoName.textContent = logoInput.files && logoInput.files[0] ? logoInput.files[0].name : "No file chosen";
  });

  dropZone.addEventListener("click", function () {
    fileInput.click();
  });

  dropZone.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", function () {
    addFiles(fileInput.files);
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach(function (eventName) {
    dropZone.addEventListener(eventName, function (event) {
      event.preventDefault();
      dropZone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach(function (eventName) {
    dropZone.addEventListener(eventName, function (event) {
      event.preventDefault();
      dropZone.classList.remove("is-dragging");
    });
  });

  dropZone.addEventListener("drop", function (event) {
    addFiles(event.dataTransfer.files);
  });

  reportForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var companyName = document.getElementById("company-name").value.trim();
    var ticketId = document.getElementById("ticket-id").value.trim();
    var contractId = document.getElementById("contract-id").value.trim();

    if (!companyName) {
      document.getElementById("company-name").focus();
      showToast("Enter a company name before generating the report.");
      return;
    }

    if (!state.category) {
      openSelect(getSelect("category"));
      showToast("Choose a category before generating the report.");
      return;
    }

    if (!state.subcategory) {
      openSelect(getSelect("subcategory"));
      showToast("Choose a sub-category before generating the report.");
      return;
    }

    if (!state.files.length) {
      dropZone.focus();
      showToast("Attach at least one system file before generating the report.");
      return;
    }

    saveHistory({
      customer: "Solaris Server",
      companyName: companyName,
      ticketId: ticketId,
      contractId: contractId,
      categoryText: getSelectedText("category"),
      subcategoryText: getSelectedText("subcategory"),
      fileCount: state.files.length,
      createdAt: new Date().toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    });

    showToast("PM report generated and added to History Log.");
    setRoute("history");
  });

  clearHistoryButton.addEventListener("click", function () {
    localStorage.removeItem(storageKey);
    renderHistory();
    showToast("History log cleared.");
  });

  resetSubcategory();
  renderFiles();
  renderHistory();
})();
