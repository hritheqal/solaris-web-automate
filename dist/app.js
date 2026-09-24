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

  function textXml(value) {
    return xmlEscape(value).split(/\r\n|\n|\r/).map(function (line, index) {
      return (index ? "<w:br/>" : "") + '<w:t xml:space="preserve">' + line + "</w:t>";
    }).join("");
  }

  function runXml(text, options) {
    var opts = options || {};
    var props = "";
    if (opts.bold) props += "<w:b/>";
    if (opts.italic) props += "<w:i/>";
    if (opts.color) props += '<w:color w:val="' + opts.color + '"/>';
    if (opts.fontSize) props += '<w:sz w:val="' + opts.fontSize + '"/>';
    props += '<w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>';
    return "<w:r>" + (props ? "<w:rPr>" + props + "</w:rPr>" : "") + textXml(text) + "</w:r>";
  }

  function paragraph(text, style, options) {
    var opts = options || {};
    var pPr = "";
    if (style) pPr += '<w:pStyle w:val="' + style + '"/>';
    if (opts.align) pPr += '<w:jc w:val="' + opts.align + '"/>';
    if (opts.keepNext) pPr += "<w:keepNext/>";
    if (opts.spacingAfter != null || opts.spacingBefore != null) {
      pPr += '<w:spacing w:before="' + (opts.spacingBefore || 0) + '" w:after="' + (opts.spacingAfter || 0) + '"/>';
    }
    return "<w:p>" + (pPr ? "<w:pPr>" + pPr + "</w:pPr>" : "") + runXml(text, opts) + "</w:p>";
  }

  function pageBreak() {
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  }

  function normalizeCell(cell) {
    return typeof cell === "object" && cell !== null ? cell : { text: cell };
  }

  function cellXml(cellValue, index, rowIndex, tableOptions) {
    var options = tableOptions || {};
    var cell = normalizeCell(cellValue);
    var isHeader = rowIndex < (options.headerRows || 0);
    var width = cell.width || (options.widths && options.widths[index]) || 2400;
    var shading = cell.shading || (isHeader ? (options.headerFill || "1f4e79") : "");
    var color = cell.color || (isHeader ? (options.headerColor || "ffffff") : "000000");
    var bold = cell.bold != null ? cell.bold : isHeader;
    var align = cell.align || (isHeader ? "center" : "left");
    var fontSize = cell.fontSize || options.fontSize || (isHeader ? 18 : 17);
    var span = cell.span ? '<w:gridSpan w:val="' + cell.span + '"/>' : "";
    var tcPr = '<w:tcW w:w="' + width + '" w:type="dxa"/>' + span + '<w:vAlign w:val="center"/>';
    if (shading) tcPr += '<w:shd w:fill="' + shading + '"/>';
    tcPr += '<w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar>';
    return "<w:tc><w:tcPr>" + tcPr + "</w:tcPr>" + paragraph(cell.text || "", "", {
      bold: bold,
      align: align,
      color: color,
      fontSize: fontSize,
      spacingAfter: 0
    }) + "</w:tc>";
  }

  function table(rows, options) {
    var opts = options || {};
    var widths = opts.widths || [];
    var border = opts.borderColor || "d9d9d9";
    var borders = opts.borders === false ? "" : '<w:tblBorders>' +
      '<w:top w:val="single" w:sz="6" w:space="0" w:color="' + border + '"/>' +
      '<w:left w:val="single" w:sz="6" w:space="0" w:color="' + border + '"/>' +
      '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="' + border + '"/>' +
      '<w:right w:val="single" w:sz="6" w:space="0" w:color="' + border + '"/>' +
      '<w:insideH w:val="single" w:sz="6" w:space="0" w:color="' + border + '"/>' +
      '<w:insideV w:val="single" w:sz="6" w:space="0" w:color="' + border + '"/>' +
      "</w:tblBorders>";
    var grid = widths.length ? "<w:tblGrid>" + widths.map(function (width) {
      return '<w:gridCol w:w="' + width + '"/>';
    }).join("") + "</w:tblGrid>" : "";

    return '<w:tbl><w:tblPr><w:tblW w:w="' + (opts.tableWidth || 0) + '" w:type="' + (opts.tableWidth ? "dxa" : "auto") + '"/>' + borders + "</w:tblPr>" +
      grid +
      rows.map(function (row, rowIndex) {
        return "<w:tr>" + row.map(function (cell, index) {
          return cellXml(cell, index, rowIndex, opts);
        }).join("") + "</w:tr>";
      }).join("") +
      "</w:tbl>";
  }

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = "";
    var quoted = false;

    for (var i = 0; i < text.length; i += 1) {
      var char = text[i];
      var next = text[i + 1];

      if (quoted) {
        if (char === '"' && next === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          field += char;
        }
      } else if (char === '"') {
        quoted = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (char !== "\r") {
        field += char;
      }
    }

    row.push(field);
    if (row.some(function (cell) { return cell !== ""; })) rows.push(row);
    return rows;
  }

  function parseCsvRows(text, fileName) {
    var matrix = parseCsv(text);
    if (matrix.length < 2) return [];
    var headers = matrix[0].map(function (header) { return header.trim(); });
    return matrix.slice(1).map(function (row) {
      var item = {};
      headers.forEach(function (header, index) {
        item[header] = row[index] || "";
      });
      item.SourceFile = fileName;
      return item;
    }).filter(function (row) {
      return row.Section || row.Command || row.Output;
    });
  }

  function collectSourceRows(files) {
    return Promise.all(files.map(function (file) {
      if (typeof file.text !== "function") return Promise.resolve([]);
      return file.text().then(function (text) {
        return parseCsvRows(text, file.name);
      });
    })).then(function (groups) {
      return groups.reduce(function (all, group) {
        return all.concat(group);
      }, []);
    });
  }

  function normalizeOutput(value) {
    return String(value || "").replace(/\r\n/g, "\n").trim();
  }

  function sectionRows(rows, sectionName) {
    var target = String(sectionName).toLowerCase();
    return rows.filter(function (row) {
      return String(row.Section || "").toLowerCase() === target;
    });
  }

  function firstOutput(rows, sectionName, fallback) {
    var row = sectionRows(rows, sectionName)[0];
    return normalizeOutput(row && row.Output) || fallback || "";
  }

  function combinedOutput(rows, sectionName, fallback) {
    var output = sectionRows(rows, sectionName).map(function (row) {
      return normalizeOutput(row.Output);
    }).filter(Boolean).join("\n");
    return output || fallback || "";
  }

  function isOkOutput(value) {
    var text = String(value || "").toLowerCase();
    if (!text.trim()) return false;
    if (/not found|not ok|warning|error|crit|fatal|fault|failed|inaccessible|needs/.test(text)) return false;
    return /healthy|all ok|all pools are healthy|ok|version|sparc|solaris|ilom|gb|enabled/.test(text);
  }

  function compactOutput(value, limit) {
    var text = normalizeOutput(value).replace(/\t/g, " ");
    if (!limit || text.length <= limit) return text || "-";
    return text.slice(0, limit - 18).trim() + "\n[Output truncated]";
  }

  function buildReportData(rows) {
    return {
      hostname: firstOutput(rows, "Hostname", "-"),
      model: firstOutput(rows, "Model", "-"),
      reportDate: firstOutput(rows, "Date", "-"),
      uptime: firstOutput(rows, "Uptime", "-"),
      serialNumber: firstOutput(rows, "Serial Number", "-"),
      firmwareVersion: firstOutput(rows, "Firmware Version", "-"),
      osInfo: firstOutput(rows, "OS Information", "-"),
      diskManagement: combinedOutput(rows, "Disk Management", "-"),
      filesystem: combinedOutput(rows, "Filesystem Status", "-"),
      syslog: combinedOutput(rows, "System status from syslog", "-"),
      fma: combinedOutput(rows, "FMA (Hardware Status)", "-"),
      services: combinedOutput(rows, "Services", "-"),
      hardwareDiagnostic: combinedOutput(rows, "Hardware diagnostic", "-"),
      hardDisk: combinedOutput(rows, "Hard disk device statistics", "-"),
      hba: combinedOutput(rows, "HBA Port Link Status", "-"),
      enclosure: combinedOutput(rows, "Enclosure/Disk Status", "-")
    };
  }

  function issueRowsFromData(record) {
    var rows = record.sourceRows || [];
    var serial = (record.reportData && record.reportData.serialNumber) || "-";
    var issueRows = rows.filter(function (row) {
      var output = normalizeOutput(row.Output).toLowerCase();
      return /not found|not ok|warning|error|crit|fatal|fault|failed|inaccessible|needs/.test(output);
    }).slice(0, 8);

    if (!issueRows.length) {
      return [[serial, "No critical issue highlighted from uploaded CSV", "Low", "Continue routine monitoring"]];
    }

    return issueRows.map(function (row) {
      return [
        serial,
        row.Section || "System Check",
        /fatal|crit|fault|failed|not ok/.test(String(row.Output).toLowerCase()) ? "High" : "Medium",
        compactOutput(row.Output, 220)
      ];
    });
  }

  function recommendationRowsFromData(record) {
    var issues = issueRowsFromData(record).filter(function (row) {
      return row[1] !== "No critical issue highlighted from uploaded CSV";
    });
    if (!issues.length) {
      return [["Routine Maintenance", "No immediate remediation required from uploaded CSV", "Monitor during next PM cycle"]];
    }

    return issues.slice(0, 6).map(function (issue) {
      return [
        issue[1],
        "Review command output and remediate before report closure",
        issue[2] + " priority"
      ];
    });
  }

  function statusCell(value, type) {
    if (type === "pm") return "[ ] Onsite\n[ ] Offsite";
    if (type === "virt") return "[ ] LDOM\n[ ] Zone\n[ ] Not Applicable";
    return (isOkOutput(value) ? "[x] OK\n[ ] Not OK" : "[ ] OK\n[x] Not OK");
  }

  function reportHeaderTable() {
    return table([[
      { text: "", width: 2100 },
      { text: "PREVENTIVE MAINTENANCE REPORT", bold: true, align: "center", fontSize: 20, width: 5200 },
      { text: "Doc ID: QMS-P09-F01\nVersion: 2.0", align: "right", fontSize: 15, width: 3000 }
    ]], { widths: [2100, 5200, 3000], borders: false, fontSize: 16 });
  }

  function footerTable() {
    return table([[
      { text: "CUSTOMER CONFIDENTIAL\nCOPYRIGHT (C) 2026 CTC GLOBAL SDN BHD (1031393-W). ALL RIGHTS RESERVED.", fontSize: 13, width: 8500 },
      { text: "", fontSize: 13, align: "right", width: 1200 }
    ]], { widths: [8500, 1200], borders: false, fontSize: 13 });
  }

  function buildCoverPage(record) {
    var data = record.reportData;
    return reportHeaderTable() +
      paragraph("", "") +
      paragraph("PREVENTIVE MAINTENANCE REPORT", "Title", { align: "center", spacingAfter: 260 }) +
      table([
        ["PM REPORT DATE", data.reportDate || record.createdAt],
        ["FSMS ID", record.ticketId || "-"],
        ["CONTRACT NO", record.contractId || "-"],
        ["CONTRACT PERIOD", "-"],
        ["CUSTOMER", record.companyName],
        ["SYSTEM", "Solaris Server"]
      ], { widths: [3000, 6400], headerRows: 0, fontSize: 18 }) +
      paragraph("This document contains information proprietary to CTC Global Sdn Bhd and the named customer. The information is intended for preventive maintenance reporting only.", "", { spacingBefore: 240, spacingAfter: 160 }) +
      footerTable();
  }

  function buildAuthorizationPage(record) {
    return reportHeaderTable() +
      paragraph("Document Authorization", "Heading1") +
      table([
        [{ text: "Author's Details", bold: true, shading: "d9eaf7", span: 2 }],
        ["Name", ""],
        ["Designation", ""],
        ["Date", ""],
        ["Signature", ""],
        [{ text: "Verified by", bold: true, shading: "d9eaf7", span: 2 }],
        ["Name", ""],
        ["Designation", ""],
        ["Date", ""],
        ["Signature", ""],
        [{ text: "Reviewed and acknowledged by " + record.companyName + " Representative", bold: true, shading: "d9eaf7", span: 2 }],
        ["Name", ""],
        ["Designation", ""],
        ["Date", ""],
        ["Signature", ""]
      ], { widths: [3000, 6400], fontSize: 17 }) +
      paragraph("Quick Customer Satisfaction Survey", "Heading1", { spacingBefore: 240 }) +
      table([
        ["How satisfied are you with the level of the CTC Preventive Maintenance service?", ""]
      ], { widths: [6600, 2800], fontSize: 17 }) +
      footerTable();
  }

  function buildTocPage() {
    return reportHeaderTable() +
      paragraph("Table of Contents", "Heading1") +
      table([
        ["1. Introduction", "1"],
        ["2. Site Details", "2"],
        ["Equipment Inventory", "3"],
        ["3. Key Highlights", "4"],
        ["Issue Highlights", "4"],
        ["Recommendations", "5"],
        ["4. Hardware and OS Checklist", "6"],
        ["Detailed Command Output", "Appendix"]
      ], { widths: [7600, 1600], fontSize: 18 }) +
      footerTable();
  }

  function buildIntroduction(record) {
    return reportHeaderTable() +
      paragraph("1. Introduction", "Heading1") +
      paragraph("This document has been prepared based on the preventive maintenance activities performed on Oracle servers by CTC engineers for " + record.companyName + " on " + (record.reportData.reportDate || record.createdAt) + ".") +
      paragraph("The following components were conducted by CTC engineers during the engagement:") +
      table([
        ["G", "Check Server Hardware Health", ""],
        ["G", "Check Server Firmware Version", ""],
        ["G", "Check Operating System Health (File system, Network, Services Status)", ""],
        ["G", "Review System Logs", ""]
      ], { widths: [700, 7300, 1400], fontSize: 18 }) +
      footerTable();
  }

  function buildSiteDetails(record) {
    return reportHeaderTable() +
      paragraph("2. Site Details", "Heading1") +
      table([
        [{ text: "Site 1", bold: true, shading: "d9eaf7", span: 2 }],
        ["Site Name", ""],
        ["Site Address", ""],
        ["Site Contact Name", ""],
        ["Site Contact Phone", ""],
        ["Site Contact Email Address", ""]
      ], { widths: [3200, 6200], fontSize: 17 }) +
      paragraph("", "", { spacingAfter: 120 }) +
      table([
        [{ text: "Site 2", bold: true, shading: "d9eaf7", span: 2 }],
        ["Site Name", ""],
        ["Site Address", ""],
        ["Site Contact Name", ""],
        ["Site Contact Phone", ""],
        ["Site Contact Email Address", ""]
      ], { widths: [3200, 6200], fontSize: 17 }) +
      paragraph("Equipment Inventory", "Heading1", { spacingBefore: 240 }) +
      table([
        ["#", "Location", "Type", "Model", "Serial Number", "Hostname", "Remark"],
        ["1", "", "Oracle Server", record.reportData.model, record.reportData.serialNumber, record.reportData.hostname, ""]
      ], { widths: [500, 1500, 1500, 1800, 2200, 1700, 1200], headerRows: 1, fontSize: 16 }) +
      footerTable();
  }

  function buildHighlights(record) {
    return reportHeaderTable() +
      paragraph("3. Key Highlights", "Heading1") +
      paragraph("Issue Highlights", "Heading2") +
      table([["Serial Number", "Issue", "Severity", "Action Plan"]].concat(issueRowsFromData(record)), {
        widths: [2100, 2400, 1400, 3600],
        headerRows: 1,
        fontSize: 16
      }) +
      paragraph("Recommendations", "Heading2", { spacingBefore: 240 }) +
      table([["Issue", "Recommendation", "Remarks"]].concat(recommendationRowsFromData(record)), {
        widths: [2600, 4500, 2300],
        headerRows: 1,
        fontSize: 16
      }) +
      footerTable();
  }

  function checklistRows(record) {
    var data = record.reportData;
    return [
      [{ text: "Hostname:", bold: true }, { text: data.hostname, span: 3 }, { text: "Model:", bold: true }, { text: data.model, span: 2 }],
      [{ text: "Location:", bold: true }, { text: "", span: 3 }, { text: "Serial Number:", bold: true }, { text: data.serialNumber, span: 2 }],
      [{ text: "Environment:", bold: true }, { text: "", span: 3 }, { text: "Date:", bold: true }, { text: data.reportDate, span: 2 }],
      [{ text: "Application:", bold: true }, { text: "", span: 3 }, { text: "Uptime:", bold: true }, { text: data.uptime, span: 2 }],
      [{ text: "Note: Please fill in the appropriate available options", span: 7, shading: "d9eaf7", bold: true }],
      ["1", { text: "PHYSICAL ACTIVITIES", bold: true, span: 6, shading: "bfbfbf" }],
      ["", "PM Activity is", statusCell("", "pm"), "", "", "", ""],
      ["", "Firmware Version\nILOM -> version\nXSCF -> showversion -v\n# ipmitool sunoem cli", statusCell(data.firmwareVersion), compactOutput(data.firmwareVersion, 1000), "", "", ""],
      ["", "Any fault LED lights (amber) are lit\n(e.g. Front/Back Panel, individual components)", "[ ] Yes\n[ ] No", "", "", "", ""],
      ["2", { text: "SYSTEM HEALTH - FOR ONLINE PM", bold: true, span: 6, shading: "bfbfbf" }],
      ["", "OS Information\n# uname -a\n# pkg info entire | grep Version", statusCell(data.osInfo), compactOutput(data.osInfo, 1200), "", "", ""],
      ["", "Disk Management Status\nSolaris 11\n# zpool status -xv", statusCell(data.diskManagement), compactOutput(data.diskManagement, 1800), "", "", ""],
      ["", "Filesystem Status\n# zpool list\n# zfs list\n# df -h", statusCell(data.filesystem), compactOutput(data.filesystem, 2800), "", "", ""],
      ["", "System status from syslog\n# tail /var/adm/messages\n# dmesg | grep -i warn fatal error crit", statusCell(data.syslog), compactOutput(data.syslog, 2200), "", "", ""],
      ["", "FMA (hardware status)\n# fmadm faulty\n# fmdump", statusCell(data.fma), compactOutput(data.fma, 2200), "", "", ""],
      ["", "Services\n# svcs -xv", statusCell(data.services), compactOutput(data.services, 1200), "", "", ""],
      ["", "Hardware diagnostic\n# prtdiag -v", statusCell(data.hardwareDiagnostic), compactOutput(data.hardwareDiagnostic, 3200), "", "", ""],
      ["", "Hard disk device statistics\n# iostat -En\n# luxadm probe", statusCell(data.hardDisk), compactOutput(data.hardDisk, 1200), "", "", ""],
      ["3", { text: "VIRTUALIZATION", bold: true, span: 6, shading: "bfbfbf" }],
      ["", "Virtualization check\nLDOM # ldm list\nZone # zoneadm list -cv", statusCell("", "virt"), "", "", "", ""],
      ["", "VM health check\n# svcs -xv\n# zpool list\n# zfs list\n# df -h\n# fmadm faulty\n# dmesg | grep error", "[ ] OK\n[ ] Not OK\n[ ] Not Applicable", "", "", "", ""]
    ];
  }

  function buildChecklist(record) {
    return reportHeaderTable() +
      paragraph("4. Hardware and OS Checklist", "Heading1") +
      table(checklistRows(record), {
        widths: [600, 2900, 1400, 2600, 800, 1000, 900],
        fontSize: 14,
        headerRows: 0
      }) +
      footerTable();
  }

  function buildDetailedOutput(record) {
    var sourceRows = record.sourceRows || [];
    var rows = [["Section", "Command", "Output", "Remarks"]].concat(sourceRows.map(function (row) {
      return [
        row.Section || "",
        row.Command || "",
        compactOutput(row.Output, 6000),
        row.Remarks || ""
      ];
    }));
    return reportHeaderTable() +
      paragraph("Detailed Command Output", "Heading1") +
      table(rows, {
        widths: [1900, 2700, 4300, 900],
        headerRows: 1,
        fontSize: 13
      }) +
      footerTable();
  }

  function buildHeaderXml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      reportHeaderTable() +
      "</w:hdr>";
  }

  function buildFooterXml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      footerTable() +
      "</w:ftr>";
  }

  function buildDocumentXml(record) {
    record.reportData = record.reportData || buildReportData(record.sourceRows || []);
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      "<w:body>" +
      buildCoverPage(record) +
      pageBreak() +
      buildAuthorizationPage(record) +
      pageBreak() +
      buildTocPage() +
      pageBreak() +
      buildIntroduction(record) +
      pageBreak() +
      buildSiteDetails(record) +
      pageBreak() +
      buildHighlights(record) +
      pageBreak() +
      buildChecklist(record) +
      pageBreak() +
      buildDetailedOutput(record) +
      '<w:sectPr><w:headerReference w:type="default" r:id="rId2"/><w:footerReference w:type="default" r:id="rId3"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="360" w:right="620" w:bottom="360" w:left="620" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr>' +
      "</w:body></w:document>";
  }

  function buildStylesXml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="020817"/><w:sz w:val="40"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="0f8f8f"/><w:sz w:val="24"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="f00645"/><w:sz w:val="28"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="22"/></w:rPr></w:style>' +
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
          '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' +
          '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
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
          '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' +
          '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' +
          "</Relationships>"
      },
      { name: "word/document.xml", data: buildDocumentXml(record) },
      { name: "word/styles.xml", data: buildStylesXml() },
      { name: "word/header1.xml", data: buildHeaderXml(record) },
      { name: "word/footer1.xml", data: buildFooterXml(record) },
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

  reportForm.addEventListener("submit", async function (event) {
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

    var sourceRows = [];
    try {
      sourceRows = await collectSourceRows(state.files);
    } catch (error) {
      showToast("Could not read the uploaded CSV files. Please try again.");
      return;
    }

    if (!sourceRows.length) {
      dropZone.focus();
      showToast("Upload at least one CSV file with Section, Command, Output, Remarks columns.");
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
      sourceRows: sourceRows,
      reportData: buildReportData(sourceRows),
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

    saveHistory({
      customer: record.customer,
      companyName: record.companyName,
      ticketId: record.ticketId,
      contractId: record.contractId,
      categoryText: record.categoryText,
      subcategoryText: record.subcategoryText,
      fileCount: record.fileCount,
      createdAt: record.createdAt,
      generatedAtIso: record.generatedAtIso,
      reportFileName: record.reportFileName,
      files: record.files
    });

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
