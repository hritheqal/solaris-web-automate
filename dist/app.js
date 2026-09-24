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

  function xmlEscape(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function makeSafeFileName(value) {
    return String(value || "PM_Report")
      .trim()
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || "PM_Report";
  }

  function makeReportFileName(companyName, generatedAt) {
    var stamp = generatedAt.toISOString().slice(0, 19).replace(/[-:T]/g, "");
    return makeSafeFileName(companyName) + "_PMReport_" + stamp + ".docx";
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function paragraph(text, style) {
    var styleXml = style ? '<w:pPr><w:pStyle w:val="' + style + '"/></w:pPr>' : "";
    return '<w:p>' + styleXml + '<w:r><w:t xml:space="preserve">' + xmlEscape(text) + "</w:t></w:r></w:p>";
  }

  function table(rows) {
    return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>' +
      '<w:top w:val="single" w:sz="6" w:space="0" w:color="c9ceda"/>' +
      '<w:left w:val="single" w:sz="6" w:space="0" w:color="c9ceda"/>' +
      '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="c9ceda"/>' +
      '<w:right w:val="single" w:sz="6" w:space="0" w:color="c9ceda"/>' +
      '<w:insideH w:val="single" w:sz="6" w:space="0" w:color="c9ceda"/>' +
      '<w:insideV w:val="single" w:sz="6" w:space="0" w:color="c9ceda"/>' +
      "</w:tblBorders></w:tblPr>" +
      rows.map(function (row) {
        return "<w:tr>" + row.map(function (cell, index) {
          var width = index === 0 ? 3200 : 6200;
          return '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/></w:tcPr>' + paragraph(cell) + "</w:tc>";
        }).join("") + "</w:tr>";
      }).join("") +
      "</w:tbl>";
  }

  function buildDocumentXml(record) {
    var fileRows = [["File Name", "Size", "Type", "Last Modified"]].concat(record.files.map(function (file) {
      return [file.name, file.size, file.type, file.lastModified];
    }));

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      "<w:body>" +
      paragraph("PM Report System", "Title") +
      paragraph("Solaris Server Preventive Maintenance Report", "Subtitle") +
      paragraph("Customer Information", "Heading1") +
      table([
        ["Company Name", record.companyName],
        ["Customer", record.customer],
        ["Ticket ID", record.ticketId || "-"],
        ["Contract ID", record.contractId || "-"],
        ["Category", record.categoryText],
        ["Sub-Category", record.subcategoryText],
        ["Generated At", record.createdAt]
      ]) +
      paragraph("", "") +
      paragraph("Attached System Files", "Heading1") +
      table(fileRows) +
      paragraph("", "") +
      paragraph("Maintenance Summary", "Heading1") +
      paragraph("This PM report was generated from the submitted Solaris Server customer information and attached system files.") +
      table([
        ["Checklist Item", "Status"],
        ["Customer information captured", "Complete"],
        ["System files attached", "Complete"],
        ["PM report document generated", "Complete"]
      ]) +
      paragraph("", "") +
      paragraph("Prepared by PM Report System") +
      '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>' +
      "</w:body></w:document>";
  }

  function buildStylesXml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="020817"/><w:sz w:val="40"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="0f8f8f"/><w:sz w:val="24"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="f00645"/><w:sz w:val="28"/></w:rPr></w:style>' +
      "</w:styles>";
  }

  function buildDocxFiles(record) {
    var now = record.generatedAtIso;
    return [
      {
        name: "[Content_Types].xml",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
          '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
          '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
          '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
          "</Types>"
      },
      {
        name: "_rels/.rels",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
          '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
          '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
          "</Relationships>"
      },
      {
        name: "word/_rels/document.xml.rels",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
          "</Relationships>"
      },
      { name: "word/document.xml", data: buildDocumentXml(record) },
      { name: "word/styles.xml", data: buildStylesXml() },
      {
        name: "docProps/core.xml",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
          "<dc:title>" + xmlEscape("PM Report - " + record.companyName) + "</dc:title>" +
          "<dc:creator>PM Report System</dc:creator>" +
          "<cp:lastModifiedBy>PM Report System</cp:lastModifiedBy>" +
          '<dcterms:created xsi:type="dcterms:W3CDTF">' + xmlEscape(now) + "</dcterms:created>" +
          '<dcterms:modified xsi:type="dcterms:W3CDTF">' + xmlEscape(now) + "</dcterms:modified>" +
          "</cp:coreProperties>"
      },
      {
        name: "docProps/app.xml",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
          "<Application>PM Report System</Application>" +
          "</Properties>"
      }
    ];
  }

  var crcTable;

  function getCrcTable() {
    if (crcTable) return crcTable;
    crcTable = [];
    for (var n = 0; n < 256; n += 1) {
      var c = n;
      for (var k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c >>> 0;
    }
    return crcTable;
  }

  function crc32(bytes) {
    var tableValues = getCrcTable();
    var crc = 0xffffffff;
    for (var i = 0; i < bytes.length; i += 1) {
      crc = tableValues[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function createZip(files) {
    var encoder = new TextEncoder();
    var parts = [];
    var centralParts = [];
    var offset = 0;

    files.forEach(function (file) {
      var nameBytes = encoder.encode(file.name);
      var dataBytes = typeof file.data === "string" ? encoder.encode(file.data) : file.data;
      var checksum = crc32(dataBytes);

      var localHeader = new Uint8Array(30 + nameBytes.length);
      var localView = new DataView(localHeader.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, 0, true);
      localView.setUint16(12, 0, true);
      localView.setUint32(14, checksum, true);
      localView.setUint32(18, dataBytes.length, true);
      localView.setUint32(22, dataBytes.length, true);
      localView.setUint16(26, nameBytes.length, true);
      localView.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      parts.push(localHeader, dataBytes);

      var centralHeader = new Uint8Array(46 + nameBytes.length);
      var centralView = new DataView(centralHeader.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, 0, true);
      centralView.setUint16(14, 0, true);
      centralView.setUint32(16, checksum, true);
      centralView.setUint32(20, dataBytes.length, true);
      centralView.setUint32(24, dataBytes.length, true);
      centralView.setUint16(28, nameBytes.length, true);
      centralView.setUint16(30, 0, true);
      centralView.setUint16(32, 0, true);
      centralView.setUint16(34, 0, true);
      centralView.setUint16(36, 0, true);
      centralView.setUint32(38, 0, true);
      centralView.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);
      centralParts.push(centralHeader);

      offset += localHeader.length + dataBytes.length;
    });

    var centralSize = centralParts.reduce(function (total, part) {
      return total + part.length;
    }, 0);

    var endRecord = new Uint8Array(22);
    var endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);
    endView.setUint16(20, 0, true);

    return new Blob(parts.concat(centralParts, [endRecord]), {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
  }

  function downloadBlob(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function downloadReport(record) {
    var reportBlob = createZip(buildDocxFiles(record));
    downloadBlob(reportBlob, record.reportFileName);
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
      var report = document.createElement("p");
      var badge = document.createElement("div");

      title.textContent = item.companyName || "Untitled company";
      meta.textContent = [
        item.customer,
        item.categoryText,
        item.subcategoryText,
        item.fileCount + " file" + (item.fileCount === 1 ? "" : "s"),
        item.createdAt
      ].filter(Boolean).join(" | ");
      report.className = "history-report";
      report.textContent = item.reportFileName ? "Report file: " + item.reportFileName : "";
      badge.className = "history-badge";
      badge.textContent = "Downloaded";

      details.appendChild(title);
      details.appendChild(meta);
      if (report.textContent) {
        details.appendChild(report);
      }
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

    var generatedAt = new Date();
    var reportFileName = makeReportFileName(companyName, generatedAt);
    var record = {
      customer: "Solaris Server",
      companyName: companyName,
      ticketId: ticketId,
      contractId: contractId,
      categoryText: getSelectedText("category"),
      subcategoryText: getSelectedText("subcategory"),
      fileCount: state.files.length,
      createdAt: generatedAt.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      generatedAtIso: generatedAt.toISOString(),
      reportFileName: reportFileName,
      files: state.files.map(function (file) {
        return {
          name: file.name,
          size: formatBytes(file.size),
          type: file.type || "Text/CSV",
          lastModified: formatDate(file.lastModified)
        };
      })
    };

    try {
      downloadReport(record);
    } catch (error) {
      showToast("Could not download the PM report. Please try again.");
      return;
    }

    saveHistory(record);

    showToast("PM report downloaded and added to History Log.");
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
