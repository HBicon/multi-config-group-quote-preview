(() => {
  "use strict";

  const STORAGE_KEY = "multi-group-quote-config-prototype-v4";
  const PAGE_VERSION = 2;
  const TODAY = new Date().toISOString().slice(0, 10);

  const CHANNELS = [
    { value: "闲鱼", label: "闲鱼", note: "线上渠道" },
    { value: "回收宝", label: "回收宝", note: "线上渠道" },
    { value: "京东", label: "京东", note: "线上渠道" },
    { value: "抖音", label: "抖音", note: "内容渠道" },
    { value: "支付宝", label: "支付宝", note: "生态渠道" },
    { value: "门店", label: "门店", note: "线下渠道" }
  ];

  const BUYER_TYPES = [
    { value: "商家买家", label: "商家买家", note: "企业主体" },
    { value: "个人买家", label: "个人买家", note: "个人主体" },
    { value: "渠道服务商", label: "渠道服务商", note: "服务商" },
    { value: "区域代理", label: "区域代理", note: "区域经营" }
  ];

  const BUYER_DIRECTORY = [
    { id: "B-1001", name: "华东优品", company: "华东优品回收有限公司", tag: "核心买家" },
    { id: "B-1002", name: "星河数码", company: "上海星河数码科技有限公司", tag: "优选买家" },
    { id: "B-1003", name: "极客换机", company: "杭州极客换机服务有限公司", tag: "渠道买家" },
    { id: "B-1004", name: "二手优选", company: "南京二手优选贸易有限公司", tag: "核心买家" },
    { id: "B-1005", name: "云帆通讯", company: "苏州云帆通讯设备有限公司", tag: "区域买家" },
    { id: "B-1006", name: "小象换机", company: "宁波小象循环科技有限公司", tag: "成长买家" },
    { id: "B-1007", name: "一诺回收", company: "无锡一诺再生资源有限公司", tag: "区域买家" },
    { id: "B-1008", name: "拾光数码", company: "合肥拾光数码贸易有限公司", tag: "渠道买家" }
  ];

  const TAG_SUGGESTIONS = ["高价", "中高价", "渠道专享", "核心渠道", "新客价"];

  const elements = {
    form: document.querySelector("#config-form"),
    pageStatus: document.querySelector("#page-status"),
    savedState: document.querySelector("#saved-state"),
    descriptionCount: document.querySelector("#description-count"),
    groupList: document.querySelector("#group-list"),
    groupCount: document.querySelector("#group-count"),
    addGroup: document.querySelector("#add-group"),
    copyLastGroup: document.querySelector("#copy-last-group"),
    summaryRing: document.querySelector("#completion-ring"),
    summaryValue: document.querySelector("#completion-value"),
    checkList: document.querySelector("#check-list"),
    overviewName: document.querySelector("#overview-name"),
    overviewPriority: document.querySelector("#overview-priority"),
    overviewRange: document.querySelector("#overview-range"),
    overviewGroupCount: document.querySelector("#overview-group-count"),
    overviewBuyerCount: document.querySelector("#overview-buyer-count"),
    overviewChannelCount: document.querySelector("#overview-channel-count"),
    toastRegion: document.querySelector("#toast-region"),
    buyerDialog: document.querySelector("#buyer-picker-dialog"),
    buyerSearch: document.querySelector("#buyer-search"),
    buyerList: document.querySelector("#buyer-picker-list"),
    buyerSelectedCount: document.querySelector("#buyer-selected-count"),
    applyBuyers: document.querySelector("#apply-buyers"),
    importDialog: document.querySelector("#buyer-import-dialog"),
    importGroupLabel: document.querySelector("#import-group-label"),
    importDropzone: document.querySelector("#import-dropzone"),
    buyerFile: document.querySelector("#buyer-file"),
    selectFile: document.querySelector("#select-file"),
    downloadTemplate: document.querySelector("#download-template"),
    loadDemoBuyers: document.querySelector("#load-demo-buyers"),
    importPreview: document.querySelector("#import-preview"),
    importError: document.querySelector("#import-error"),
    confirmImport: document.querySelector("#confirm-import"),
    publishDialog: document.querySelector("#publish-dialog"),
    publishSummary: document.querySelector("#publish-summary"),
    confirmPublish: document.querySelector("#confirm-publish"),
    successDialog: document.querySelector("#success-dialog"),
    publishedId: document.querySelector("#published-id"),
    copyConfigId: document.querySelector("#copy-config-id")
  };

  let state = restoreState() || createInitialState();
  let activeGroupId = state.groups[0]?.id || null;
  const groupFieldErrors = new Map();
  let buyerDraft = new Map();
  let activeBuyerGroupId = null;
  let activeImportGroupId = null;
  let importRows = [];
  let isSaved = Boolean(state.savedAt);
  let isPublished = Boolean(state.publishedId);

  function createInitialState() {
    return {
      version: PAGE_VERSION,
      basic: {
        name: "华东手机高价回收策略",
        description: "面向华东核心渠道的高价机型回收报价配置。",
        priority: "10",
        status: "enabled",
        expiryDate: "2027-10-28"
      },
      groups: [
        {
          id: newId("group"),
          buyers: [cloneBuyer(BUYER_DIRECTORY[0]), cloneBuyer(BUYER_DIRECTORY[3])],
          channels: ["闲鱼", "回收宝"],
          buyerTypes: ["商家买家"],
          priceTags: ["高价", "核心渠道"],
          pricing: { min: "1", max: "500", bidDifference: "20" },
          fees: [{ id: newId("fee"), name: "渠道服务费", type: "fixed", value: "12", cap: "50" }]
        },
        {
          id: newId("group"),
          buyers: [cloneBuyer(BUYER_DIRECTORY[1]), cloneBuyer(BUYER_DIRECTORY[2])],
          channels: ["京东", "抖音"],
          buyerTypes: ["渠道服务商"],
          priceTags: ["中高价"],
          pricing: { min: "501", max: "2000", bidDifference: "30" },
          fees: [{ id: newId("fee"), name: "平台服务费", type: "ratio", value: "1.5", cap: "30" }]
        }
      ],
      customBuyers: [],
      savedAt: null,
      publishedId: null,
      publishedAt: null
    };
  }

  function newId(prefix) {
    const randomPart = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    return `${prefix}-${randomPart}`;
  }

  function cloneBuyer(buyer) {
    return { id: buyer.id, name: buyer.name, company: buyer.company, tag: buyer.tag };
  }

  function normalizeFee(fee = {}) {
    return {
      id: typeof fee.id === "string" ? fee.id : newId("fee"),
      name: String(fee.name ?? ""),
      type: fee.type === "ratio" ? "ratio" : "fixed",
      value: String(fee.value ?? ""),
      cap: String(fee.cap ?? "")
    };
  }

  function normalizeState(raw) {
    if (!raw || raw.version !== PAGE_VERSION || !Array.isArray(raw.groups) || !raw.basic) {
      return null;
    }

    const groups = raw.groups.map((group) => ({
      id: typeof group.id === "string" ? group.id : newId("group"),
      buyers: Array.isArray(group.buyers)
        ? group.buyers.filter((buyer) => buyer && buyer.id && buyer.name).map(cloneBuyer)
        : [],
      channels: Array.isArray(group.channels) ? group.channels.filter((item) => typeof item === "string") : [],
      buyerTypes: Array.isArray(group.buyerTypes) ? group.buyerTypes.filter((item) => typeof item === "string") : [],
      priceTags: Array.isArray(group.priceTags) ? group.priceTags.filter((item) => typeof item === "string") : [],
      pricing: {
        min: String(group.pricing?.min ?? ""),
        max: String(group.pricing?.max ?? ""),
        bidDifference: String(group.pricing?.bidDifference ?? "")
      },
      fees: Array.isArray(group.fees) && group.fees.length
        ? group.fees.map((fee) => normalizeFee(fee))
        : [normalizeFee({ name: "费用模块 1" })]
    }));

    return {
      version: PAGE_VERSION,
      basic: {
        name: String(raw.basic.name ?? ""),
        description: String(raw.basic.description ?? ""),
        priority: String(raw.basic.priority ?? ""),
        status: raw.basic.status === "disabled" ? "disabled" : "enabled",
        expiryDate: String(raw.basic.expiryDate ?? "")
      },
      groups,
      customBuyers: Array.isArray(raw.customBuyers)
        ? raw.customBuyers.filter((buyer) => buyer && buyer.id && buyer.name).map(cloneBuyer)
        : [],
      savedAt: typeof raw.savedAt === "string" ? raw.savedAt : null,
      publishedId: typeof raw.publishedId === "string" ? raw.publishedId : null,
      publishedAt: typeof raw.publishedAt === "string" ? raw.publishedAt : null
    };
  }

  function restoreState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeState(JSON.parse(raw)) : null;
    } catch (error) {
      return null;
    }
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function money(value) {
    if (!isFilled(value)) return "未填写";
    const number = Number(value);
    if (!Number.isFinite(number)) return "未填写";
    return `¥${number.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
  }

  function isFilled(value) {
    return String(value ?? "").trim().length > 0;
  }

  function toNumber(value) {
    if (!isFilled(value)) return NaN;
    return Number(value);
  }

  function hydrateBasicFields() {
    document.querySelector("#config-name").value = state.basic.name;
    document.querySelector("#config-description").value = state.basic.description;
    document.querySelector("#priority").value = state.basic.priority;
    document.querySelector("#expiry-date").value = state.basic.expiryDate;
    const statusInput = document.querySelector(`input[name="status"][value="${state.basic.status}"]`);
    if (statusInput) statusInput.checked = true;
    updateDescriptionCount();
  }

  function syncBasicFromDom() {
    state.basic.name = document.querySelector("#config-name").value;
    state.basic.description = document.querySelector("#config-description").value;
    state.basic.priority = document.querySelector("#priority").value;
    state.basic.expiryDate = document.querySelector("#expiry-date").value;
    state.basic.status = document.querySelector('input[name="status"]:checked')?.value || "enabled";
  }

  function updateDescriptionCount() {
    const length = document.querySelector("#config-description").value.length;
    elements.descriptionCount.textContent = `${length} / 200`;
  }

  function renderFees(group) {
    return group.fees.map((fee, index) => {
      const unit = fee.type === "ratio" ? "%" : "元";
      return `
        <div class="fee-row price-fee-row" data-fee-id="${escapeHtml(fee.id)}">
          ${index === 0 ? `
          <div class="field price-min-field" data-group-field="min">
            <label><span class="required">*</span>最低价</label>
            <div class="input-suffix">
              <span class="prefix">¥</span>
              <input type="number" min="0" step="1" value="${escapeHtml(group.pricing.min)}" placeholder="0" inputmode="numeric" data-group-price="min" aria-label="配置组最低价">
              <span>元</span>
            </div>
            <p class="field-error" data-group-error="min"></p>
          </div>
          <div class="field price-max-field" data-group-field="max">
            <label><span class="required">*</span>最高价</label>
            <div class="input-suffix">
              <span class="prefix">¥</span>
              <input type="number" min="0" step="1" value="${escapeHtml(group.pricing.max)}" placeholder="500" inputmode="numeric" data-group-price="max" aria-label="配置组最高价">
              <span>元</span>
            </div>
            <p class="field-error" data-group-error="max"></p>
          </div>
          <div class="field price-difference-field" data-group-field="difference">
            <label><span class="required">*</span>中标价差
              <button class="info-dot" type="button" aria-label="中标价差说明" data-tooltip="中标价差用于校准不同买家最终成交价的差额。">i</button>
            </label>
            <div class="input-suffix">
              <input type="number" min="0" step="0.01" value="${escapeHtml(group.pricing.bidDifference)}" placeholder="差额" inputmode="decimal" data-group-price="bidDifference" aria-label="配置组中标价差">
              <span>元</span>
            </div>
            <p class="field-error" data-group-error="difference"></p>
          </div>` : '<div class="price-row-spacer" aria-hidden="true"><span>同组费用</span></div>'}
          <div class="field fee-name-field">
            <label><span class="required">*</span>费用模块</label>
            <div class="fee-name-wrap">
              <span class="fee-index">${String(index + 1).padStart(2, "0")}</span>
              <input type="text" value="${escapeHtml(fee.name)}" maxlength="24" data-fee-field="name" aria-label="费用模块 ${index + 1} 名称">
            </div>
          </div>
          <div class="field fee-type-field">
            <label>计费方式</label>
            <select data-fee-field="type" aria-label="费用模块 ${index + 1} 计费方式">
              <option value="fixed"${fee.type === "fixed" ? " selected" : ""}>固定金额</option>
              <option value="ratio"${fee.type === "ratio" ? " selected" : ""}>成交价比例</option>
            </select>
          </div>
          <div class="field fee-value-field">
            <label><span class="required">*</span>金额 / 比例</label>
            <div class="input-suffix">
              <input type="number" min="0" step="0.01" value="${escapeHtml(fee.value)}" placeholder="请输入" data-fee-field="value" aria-label="费用模块 ${index + 1} 金额或比例">
              <span class="fee-unit">${unit}</span>
            </div>
          </div>
          <div class="field fee-cap-field">
            <label>封顶</label>
            <div class="input-suffix">
              <input type="number" min="0" step="0.01" value="${escapeHtml(fee.cap)}" placeholder="不封顶" data-fee-field="cap" aria-label="费用模块 ${index + 1} 封顶金额">
              <span>元</span>
            </div>
          </div>
          <button class="remove-fee" type="button" data-action="remove-fee" data-fee-id="${escapeHtml(fee.id)}" aria-label="删除费用模块 ${index + 1}" title="删除费用"${group.fees.length === 1 ? " disabled" : ""}>
            <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true"><path d="M4 5h10M7 5V3h4v2m-6 0 .6 10h4.8L11 5M7.5 8v4.5M10.5 8v4.5" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>`;
    }).join("");
  }

  function renderGroups() {
    if (!state.groups.some((group) => group.id === activeGroupId)) {
      activeGroupId = state.groups[0]?.id || null;
    }
    const activeIndex = state.groups.findIndex((group) => group.id === activeGroupId);
    const activeGroup = state.groups[activeIndex];
    elements.groupList.innerHTML = `
      <div class="group-switcher">
        <div class="group-switcher-head">
          <div class="switcher-title">
            <span class="switcher-icon" aria-hidden="true">
              <svg viewBox="0 0 18 18" width="14" height="14"><path d="M3 4.5h7M3 9h12M3 13.5h9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </span>
            <strong>配置组切换</strong>
            <span>点击 Tab 查看并编辑对应配置</span>
          </div>
          <span class="switcher-position">当前 <b>${activeIndex + 1}</b> / ${state.groups.length}</span>
        </div>
        <div class="group-tabs-row">
          <div class="group-tabs" role="tablist" aria-label="配置组切换">
            ${state.groups.map((group, index) => renderGroupTab(group, index, group.id === activeGroupId)).join("")}
          </div>
          <button class="tab-add" type="button" data-action="add-group-tab" aria-label="新增配置组 Tab" title="新增配置组 Tab">
            <svg viewBox="0 0 18 18" width="15" height="15" aria-hidden="true"><path d="M9 4v10M4 9h10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
            <span>新增 Tab</span>
          </button>
        </div>
      </div>
      ${activeGroup ? renderGroup(activeGroup, activeIndex) : ""}`;
    if (activeGroup && groupFieldErrors.has(activeGroup.id)) {
      const card = elements.groupList.querySelector(`.group-panel[data-group-id="${cssEscape(activeGroup.id)}"]`);
      if (card) {
        Object.entries(groupFieldErrors.get(activeGroup.id)).forEach(([kind, message]) => {
          setGroupFieldError(card, kind, message);
        });
      }
    }
    elements.groupCount.textContent = state.groups.length;
    updateSummary();
    ensureActiveTabVisible();
  }

  function renderGroupTab(group, index, active) {
    const complete = hasRequiredGroupFields(group);
    const statusText = complete ? "已配置" : "待完善";
    return `
      <button class="group-tab${active ? " active" : ""}${complete ? "" : " is-incomplete"}${groupFieldErrors.has(group.id) ? " has-error" : ""}" id="group-tab-${escapeHtml(group.id)}" type="button" role="tab" aria-selected="${active}" aria-controls="group-panel-${escapeHtml(group.id)}" tabindex="${active ? "0" : "-1"}" data-action="select-group" data-group-id="${escapeHtml(group.id)}" title="配置组 ${index + 1} · ${statusText}">
        <span class="tab-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="tab-copy">
          <strong>配置组 ${index + 1}</strong>
          <small>${escapeHtml(tabSummary(group))} · ${statusText}</small>
        </span>
        <span class="tab-status" aria-hidden="true"></span>
      </button>`;
  }

  function renderGroup(group, index) {
    const complete = hasRequiredGroupFields(group);
    const summary = groupSummary(group);
    return `
      <article class="group-card group-panel" id="group-panel-${escapeHtml(group.id)}" role="tabpanel" aria-labelledby="group-tab-${escapeHtml(group.id)}" data-group-id="${escapeHtml(group.id)}" tabindex="0">
        <header class="group-panel-header">
          <div class="group-panel-heading">
            <span class="panel-eyebrow">正在编辑 · TAB ${String(index + 1).padStart(2, "0")}</span>
            <span class="group-title-line">
              <strong>配置组 ${index + 1}</strong>
              <span class="group-state${complete ? "" : " incomplete"}">${complete ? "已配置" : "待完善"}</span>
            </span>
            <span class="group-summary group-panel-summary">${escapeHtml(summary)}</span>
          </div>
          <div class="group-actions">
            <button class="group-action" type="button" data-action="copy-group" data-group-id="${escapeHtml(group.id)}" aria-label="复制配置组 ${index + 1}，并新增一个相同配置的 Tab" title="复制本组并新增 Tab">
              <svg viewBox="0 0 18 18" width="14" height="14" aria-hidden="true"><rect x="6" y="6" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M4 11H3.5A1.5 1.5 0 0 1 2 9.5v-6A1.5 1.5 0 0 1 3.5 2h6A1.5 1.5 0 0 1 11 3.5V4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
              <span class="action-label">复制本组</span>
            </button>
            <button class="group-action danger icon-only" type="button" data-action="remove-group" data-group-id="${escapeHtml(group.id)}" aria-label="删除配置组 ${index + 1}" title="删除配置组"${state.groups.length === 1 ? " disabled" : ""}>
              <svg viewBox="0 0 18 18" width="14" height="14" aria-hidden="true"><path d="M4 5h10M7 5V3h4v2m-6 0 .6 10h4.8L11 5" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </header>
        <div class="group-body">
          <div class="field buyer-field" data-group-field="buyers">
            <div class="buyer-heading-row">
              <span class="field-label"><span class="required">*</span>应用买家</span>
              <div class="buyer-toolbar">
                <button class="text-action" type="button" data-action="import-buyers" data-group-id="${escapeHtml(group.id)}">批量导入买家</button>
                <button class="text-action" type="button" data-action="download-buyer-template" data-group-id="${escapeHtml(group.id)}">下载模板</button>
                <button class="text-action" type="button" data-action="export-buyers" data-group-id="${escapeHtml(group.id)}">导出配置买家</button>
              </div>
            </div>
            <div class="buyer-selector">
              <div class="buyer-chips">
                ${renderBuyerChips(group)}
              </div>
              <button class="buyer-add" type="button" data-action="pick-buyers" data-group-id="${escapeHtml(group.id)}">
                <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                选择买家
              </button>
            </div>
            <p class="field-error buyer-error" data-group-error="buyers"></p>
          </div>

          ${renderMultiSelectField(group, "channels", "应用渠道", CHANNELS)}
          ${renderMultiSelectField(group, "buyerTypes", "买家类型", BUYER_TYPES)}

          <div class="field tag-field">
            <div class="tag-heading-row">
              <span class="field-label">价格标签</span>
              <span class="field-hint">选填，可输入后按回车添加</span>
            </div>
            <div class="tag-editor">
              <div class="tag-chips">${renderTagChips(group)}</div>
              <input class="tag-input" type="text" maxlength="16" placeholder="${group.priceTags.length ? "继续添加标签" : "请输入价格标签"}" data-tag-input aria-label="配置组 ${index + 1} 价格标签">
            </div>
            <div class="tag-suggestions">
              <span>常用标签</span>
              ${TAG_SUGGESTIONS.filter((tag) => !group.priceTags.includes(tag)).map((tag) => `<button class="suggestion-tag" type="button" data-action="add-tag" data-tag="${escapeHtml(tag)}">＋ ${escapeHtml(tag)}</button>`).join("")}
            </div>
          </div>

          <section class="group-pricing" aria-label="配置组 ${index + 1} 价格与费用">
            <div class="group-pricing-head">
              <div class="group-pricing-title">
                <span class="group-pricing-icon" aria-hidden="true">¥</span>
                <span><strong>价格与费用</strong><small>价格、中标价差与费用随当前 Tab 独立保存</small></span>
              </div>
              <div class="group-pricing-actions">
                <button class="fee-add" type="button" data-action="add-fee" data-group-id="${escapeHtml(group.id)}">
                  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  添加费用
                </button>
                <span class="group-scope">本组独立</span>
              </div>
            </div>

            <div class="group-fee-block" data-group-field="fees" aria-label="费用规则">
              <div class="fee-table" data-fee-list aria-live="polite">${renderFees(group)}</div>
              <p class="field-error fee-list-error" data-group-error="fees"></p>
            </div>
          </section>
        </div>
      </article>`;
  }

  function renderBuyerChips(group) {
    if (!group.buyers.length) {
      return '<span class="buyer-placeholder">暂未选择买家，可手动选择或批量导入</span>';
    }
    return group.buyers.map((buyer) => `
      <span class="buyer-chip" title="${escapeHtml(buyer.company)}">
        <span>${escapeHtml(buyer.name)}</span>
        <button type="button" data-action="remove-buyer" data-buyer-id="${escapeHtml(buyer.id)}" aria-label="移除买家 ${escapeHtml(buyer.name)}">×</button>
      </span>`).join("");
  }

  function renderTagChips(group) {
    return group.priceTags.map((tag) => `
      <span class="tag-chip">${escapeHtml(tag)}<button type="button" data-action="remove-tag" data-tag="${escapeHtml(tag)}" aria-label="移除价格标签 ${escapeHtml(tag)}">×</button></span>`).join("");
  }

  function renderMultiSelectField(group, kind, label, options) {
    const selectedValues = group[kind];
    return `
      <div class="field" data-group-field="${kind}">
        <span class="field-label"><span class="required">*</span>${label}</span>
        <div class="multi-select" data-multi-kind="${kind}">
          <button class="select-trigger" type="button" data-action="toggle-menu" aria-expanded="false" aria-label="选择${label}">
            <span class="select-value">${renderSelectedValues(selectedValues, options)}</span>
            <svg viewBox="0 0 18 18" width="15" height="15" aria-hidden="true"><path d="m5 7 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="select-menu" hidden>
            <div class="select-menu-list">
              ${options.map((option) => `
                <label class="check-option">
                  <input type="checkbox" data-action="select-option" data-kind="${kind}" value="${escapeHtml(option.value)}"${selectedValues.includes(option.value) ? " checked" : ""}>
                  <span>${escapeHtml(option.label)}</span>
                  <small>${escapeHtml(option.note)}</small>
                </label>`).join("")}
            </div>
            <div class="select-menu-footer">
              <span>已选 ${selectedValues.length} 项</span>
              <button type="button" data-action="clear-options" data-kind="${kind}">清空</button>
            </div>
          </div>
        </div>
        <p class="field-error" data-group-error="${kind}"></p>
      </div>`;
  }

  function renderSelectedValues(values, options) {
    if (!values.length) return '<span class="buyer-placeholder">请选择</span>';
    return values.map((value) => {
      const option = options.find((item) => item.value === value);
      return `<span class="select-chip">${escapeHtml(option?.label || value)}</span>`;
    }).join("");
  }

  function groupSummary(group) {
    const parts = [];
    const range = priceRangeLabel(group);
    if (range !== "价格待设置") parts.push(range);
    if (group.buyers.length) parts.push(`${group.buyers.length} 个买家`);
    if (group.channels.length) parts.push(`${group.channels.length} 个渠道`);
    if (group.buyerTypes.length) parts.push(group.buyerTypes.join("、"));
    if (group.priceTags.length) parts.push(group.priceTags.map((tag) => `#${tag}`).join(" "));
    return parts.join(" · ") || "尚未配置买家、渠道与价格";
  }

  function tabSummary(group) {
    return `${priceRangeLabel(group, true)} · ${group.buyers.length} 买家 · ${group.channels.length} 渠道`;
  }

  function priceRangeLabel(group, compact = false) {
    const min = toNumber(group.pricing?.min);
    const max = toNumber(group.pricing?.max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 0 || min > max) {
      return "价格待设置";
    }
    if (compact) {
      const format = (value) => Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
      return `¥${format(min)}–${format(max)}`;
    }
    return `${money(min)} – ${money(max)}`;
  }

  function getGroupValidation(group) {
    const errors = {};
    if (!group.buyers.length) errors.buyers = "请至少选择 1 个买家";
    if (!group.channels.length) errors.channels = "请至少选择 1 个渠道";

    const min = toNumber(group.pricing?.min);
    if (!Number.isFinite(min) || min < 0) errors.min = "请输入有效的最低价";
    const max = toNumber(group.pricing?.max);
    if (!Number.isFinite(max) || max < 0) errors.max = "请输入有效的最高价";
    if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
      errors.max = "最高价需大于或等于最低价";
    }

    const difference = toNumber(group.pricing?.bidDifference);
    if (!Number.isFinite(difference) || difference < 0) errors.difference = "请输入有效的中标价差";

    const feeIssues = getFeesValidation(group);
    if (feeIssues.length) errors.fees = feeIssues[0];
    return errors;
  }

  function hasRequiredGroupFields(group) {
    return Object.keys(getGroupValidation(group)).length === 0;
  }

  function getFeesValidation(group) {
    const issues = [];
    if (!group.fees.length) return ["至少保留一条费用规则"];
    group.fees.forEach((fee, index) => {
      if (!isFilled(fee.name)) issues.push(`费用模块 ${index + 1} 名称不能为空`);
      const value = toNumber(fee.value);
      if (!Number.isFinite(value) || value <= 0) {
        issues.push(`费用模块 ${index + 1} 金额/比例需大于 0`);
      } else if (fee.type === "ratio" && value > 100) {
        issues.push(`费用模块 ${index + 1} 比例不能超过 100%`);
      }
      if (isFilled(fee.cap)) {
        const cap = toNumber(fee.cap);
        if (!Number.isFinite(cap) || cap < 0) issues.push(`费用模块 ${index + 1} 封顶金额不能小于 0`);
      }
    });
    return issues;
  }

  function getSummaryChecks() {
    const nameValid = isFilled(state.basic.name);
    const priority = toNumber(state.basic.priority);
    const priorityValid = Number.isInteger(priority) && priority >= 1 && priority <= 999;
    const expiryValid = !state.basic.expiryDate || state.basic.expiryDate >= TODAY;
    const groupsAdded = state.groups.length > 0;
    const groupChecks = state.groups.map(getGroupValidation);
    const groupsComplete = groupsAdded && groupChecks.every((errors) => !errors.buyers && !errors.channels);
    const pricesComplete = groupsAdded && groupChecks.every((errors) => !errors.min && !errors.max && !errors.difference && !errors.fees);

    return [
      { label: "基础信息已填写", pass: nameValid && priorityValid && expiryValid },
      { label: "配置组已添加", pass: groupsAdded, note: `${state.groups.length} 组` },
      { label: "每组买家与渠道已选择", pass: groupsComplete },
      { label: "每组价格与费用有效", pass: pricesComplete }
    ];
  }

  function updateSummary() {
    const checks = getSummaryChecks();
    const passed = checks.filter((item) => item.pass).length;
    const percent = Math.round((passed / checks.length) * 100);
    elements.summaryRing.style.setProperty("--progress", `${percent * 3.6}deg`);
    elements.summaryRing.setAttribute("aria-label", `配置完整度 ${percent}%`);
    elements.summaryValue.textContent = `${percent}%`;
    elements.checkList.innerHTML = checks.map((item) => `
      <div class="check-item ${item.pass ? "pass" : "fail"}">
        <span class="check-dot" aria-hidden="true">${item.pass ? "✓" : "!"}</span>
        <span>${item.label}</span>
        ${item.note ? `<em>${item.note}</em>` : ""}
      </div>`).join("");

    elements.overviewName.textContent = isFilled(state.basic.name) ? state.basic.name : "未填写";
    elements.overviewPriority.textContent = isFilled(state.basic.priority) ? `${state.basic.priority} 级` : "未填写";
    const pricedGroups = state.groups.filter((group) => priceRangeLabel(group) !== "价格待设置");
    elements.overviewRange.textContent = pricedGroups.length === 1
      ? priceRangeLabel(pricedGroups[0])
      : pricedGroups.length > 1
        ? `${pricedGroups.length}/${state.groups.length} 组已设置`
        : "未填写";
    elements.overviewGroupCount.textContent = `${state.groups.length} 组`;
    elements.overviewBuyerCount.textContent = `${uniqueCount(state.groups.flatMap((group) => group.buyers.map((buyer) => buyer.id)))} 个`;
    elements.overviewChannelCount.textContent = `${uniqueCount(state.groups.flatMap((group) => group.channels))} 个`;
    elements.copyLastGroup.disabled = state.groups.length === 0;
  }

  function uniqueCount(items) {
    return new Set(items).size;
  }

  function markDirty() {
    isSaved = false;
    isPublished = false;
    elements.pageStatus.textContent = "未保存";
    elements.pageStatus.className = "status-chip";
    elements.savedState.textContent = "有未保存修改";
  }

  function clearValidation() {
    groupFieldErrors.clear();
    elements.form.querySelectorAll(".is-invalid").forEach((node) => node.classList.remove("is-invalid"));
    elements.form.querySelectorAll(".field-error").forEach((node) => {
      node.textContent = "";
    });
    elements.form.querySelectorAll(".fee-row").forEach((node) => node.classList.remove("is-invalid"));
    elements.groupList.querySelectorAll(".group-tab").forEach((tab) => {
      tab.classList.remove("has-error");
      const group = findGroup(tab.dataset.groupId);
      if (group) updateGroupTabStatus(tab, group);
    });
  }

  function setFieldError(id, message) {
    const input = document.getElementById(id);
    const field = input?.closest(".field");
    field?.classList.add("is-invalid");
    const errorNode = elements.form.querySelector(`[data-error-for="${id}"]`);
    if (errorNode) errorNode.textContent = message;
  }

  function setGroupFieldError(card, kind, message) {
    const field = card.querySelector(`[data-group-field="${kind}"]`);
    field?.classList.add("is-invalid");
    card.classList.add("is-invalid");
    if (kind === "fees") {
      card.querySelectorAll(".fee-row").forEach((row) => row.classList.add("is-invalid"));
    }
    const errorNode = card.querySelector(`[data-group-error="${kind}"]`);
    if (errorNode) errorNode.textContent = message;
  }

  function validateForPublish() {
    syncBasicFromDom();
    clearValidation();
    let issueCount = 0;

    if (!isFilled(state.basic.name)) {
      setFieldError("config-name", "请输入配置名称");
      issueCount += 1;
    }

    const priority = toNumber(state.basic.priority);
    if (!Number.isInteger(priority) || priority < 1 || priority > 999) {
      setFieldError("priority", "请输入 1–999 之间的整数");
      issueCount += 1;
    }

    if (state.basic.expiryDate && state.basic.expiryDate < TODAY) {
      setFieldError("expiry-date", "失效时间不能早于今天");
      issueCount += 1;
    }

    if (!state.groups.length) {
      const groupError = elements.form.querySelector('[data-error-for="groups"]');
      if (groupError) groupError.textContent = "请至少添加一个配置组";
      issueCount += 1;
    }

    const invalidGroups = [];
    state.groups.forEach((group, index) => {
      const errors = getGroupValidation(group);
      const errorCount = Object.keys(errors).length;
      if (!errorCount) return;
      issueCount += errorCount;
      invalidGroups.push({ group, index, errors });
    });

    if (invalidGroups.length) {
      activeGroupId = invalidGroups[0].group.id;
      invalidGroups.forEach(({ group, errors }) => groupFieldErrors.set(group.id, errors));
      renderGroups();
    }

    updateSummary();
    if (issueCount > 0) {
      showToast(`还有 ${issueCount} 项需要完善，请检查标红字段`, "error", 3600);
      requestAnimationFrame(() => {
        elements.form.querySelector(".is-invalid")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
    return issueCount;
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function showToast(message, type = "success", duration = 2800) {
    const toast = document.createElement("div");
    toast.className = `toast${type === "error" ? " error" : ""}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.innerHTML = `<span aria-hidden="true">${type === "error" ? "!" : "✓"}</span><div>${escapeHtml(message)}</div>`;
    elements.toastRegion.appendChild(toast);
    window.setTimeout(() => {
      toast.classList.add("leaving");
      window.setTimeout(() => toast.remove(), 220);
    }, duration);
  }

  function findGroup(groupId) {
    return state.groups.find((group) => group.id === groupId);
  }

  function addBlankGroup() {
    const group = {
      id: newId("group"),
      buyers: [],
      channels: [],
      buyerTypes: [],
      priceTags: [],
      pricing: { min: "", max: "", bidDifference: "" },
      fees: [normalizeFee({ name: "费用模块 1" })],
      collapsed: false
    };
    state.groups.push(group);
    activeGroupId = group.id;
    renderGroups();
    markDirty();
    scrollToGroup(group.id);
    showToast(`已新增配置组 ${state.groups.length}`);
  }

  function cloneGroup(source) {
    return {
      id: newId("group"),
      buyers: source.buyers.map(cloneBuyer),
      channels: [...source.channels],
      buyerTypes: [...source.buyerTypes],
      priceTags: [...source.priceTags],
      pricing: { ...source.pricing },
      fees: source.fees.map((fee) => normalizeFee({ ...fee, id: newId("fee") })),
      collapsed: false
    };
  }

  function copyLastGroup() {
    if (!state.groups.length) return;
    const source = state.groups[state.groups.length - 1];
    const copy = cloneGroup(source);
    state.groups.push(copy);
    activeGroupId = copy.id;
    renderGroups();
    markDirty();
    scrollToGroup(copy.id);
    showToast(`已复制配置组 ${state.groups.length - 1} 的内容`);
  }

  function copyGroup(groupId) {
    const index = state.groups.findIndex((group) => group.id === groupId);
    if (index < 0) return;
    const copy = cloneGroup(state.groups[index]);
    state.groups.splice(index + 1, 0, copy);
    activeGroupId = copy.id;
    renderGroups();
    markDirty();
    scrollToGroup(copy.id);
    showToast(`已复制配置组 ${index + 1} 并插入为新组`);
  }

  function removeGroup(groupId) {
    if (state.groups.length <= 1) return;
    const index = state.groups.findIndex((group) => group.id === groupId);
    if (index < 0) return;
    state.groups.splice(index, 1);
    if (activeGroupId === groupId) {
      activeGroupId = state.groups[Math.min(index, state.groups.length - 1)]?.id || null;
    }
    renderGroups();
    markDirty();
    showToast(`已删除配置组 ${index + 1}`);
  }

  function scrollToGroup(groupId) {
    requestAnimationFrame(() => {
      const card = elements.groupList.querySelector(`.group-panel[data-group-id="${cssEscape(groupId)}"]`);
      card?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function selectGroup(groupId) {
    if (!findGroup(groupId)) return;
    if (activeGroupId === groupId) return;
    activeGroupId = groupId;
    renderGroups();
    requestAnimationFrame(() => {
      elements.groupList.querySelector(`#group-tab-${cssEscape(groupId)}`)?.focus({ preventScroll: true });
    });
  }

  function ensureActiveTabVisible() {
    requestAnimationFrame(() => {
      const activeTab = elements.groupList.querySelector('.group-tab[aria-selected="true"]');
      if (!activeTab) return;
      const tabs = activeTab.closest(".group-tabs");
      if (!tabs) return;
      const tabsRect = tabs.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      if (tabRect.left < tabsRect.left) {
        tabs.scrollBy({ left: tabRect.left - tabsRect.left - 8, behavior: "smooth" });
      } else if (tabRect.right > tabsRect.right) {
        tabs.scrollBy({ left: tabRect.right - tabsRect.right + 8, behavior: "smooth" });
      }
    });
  }

  function getAvailableBuyers(group) {
    const map = new Map();
    [...BUYER_DIRECTORY, ...state.customBuyers, ...group.buyers].forEach((buyer) => {
      if (!map.has(buyer.id)) map.set(buyer.id, cloneBuyer(buyer));
    });
    return [...map.values()];
  }

  function openBuyerPicker(groupId) {
    const group = findGroup(groupId);
    if (!group) return;
    activeBuyerGroupId = groupId;
    buyerDraft = new Map(group.buyers.map((buyer) => [buyer.id, cloneBuyer(buyer)]));
    elements.buyerSearch.value = "";
    renderBuyerPicker();
    elements.buyerDialog.showModal();
    window.setTimeout(() => elements.buyerSearch.focus(), 30);
  }

  function renderBuyerPicker() {
    const group = findGroup(activeBuyerGroupId);
    if (!group) return;
    const query = elements.buyerSearch.value.trim().toLowerCase();
    const buyers = getAvailableBuyers(group).filter((buyer) => {
      const haystack = `${buyer.name} ${buyer.id} ${buyer.company}`.toLowerCase();
      return haystack.includes(query);
    });

    elements.buyerList.innerHTML = buyers.length
      ? buyers.map((buyer) => {
          const selected = buyerDraft.has(buyer.id);
          return `
            <label class="buyer-option${selected ? " selected" : ""}">
              <input type="checkbox" value="${escapeHtml(buyer.id)}"${selected ? " checked" : ""} aria-label="选择买家 ${escapeHtml(buyer.name)}">
              <span class="buyer-avatar" aria-hidden="true">${escapeHtml(buyer.name.slice(0, 1))}</span>
              <span class="buyer-info"><strong>${escapeHtml(buyer.name)}</strong><span>${escapeHtml(buyer.id)} · ${escapeHtml(buyer.company)}</span></span>
              <span class="buyer-tag">${escapeHtml(buyer.tag)}</span>
            </label>`;
        }).join("")
      : '<div class="empty-picker">没有找到匹配的买家</div>';
    updateBuyerPickerCount();
  }

  function updateBuyerPickerCount() {
    elements.buyerSelectedCount.textContent = `已选 ${buyerDraft.size} 个`;
  }

  function applyBuyerSelection() {
    const group = findGroup(activeBuyerGroupId);
    if (!group) return;
    group.buyers = [...buyerDraft.values()].map(cloneBuyer);
    elements.buyerDialog.close();
    clearValidation();
    renderGroups();
    markDirty();
    showToast(group.buyers.length ? `已选择 ${group.buyers.length} 个买家` : "已清空当前配置组的买家");
  }

  function openImportDialog(groupId) {
    const group = findGroup(groupId);
    if (!group) return;
    activeImportGroupId = groupId;
    const index = state.groups.findIndex((item) => item.id === groupId);
    elements.importGroupLabel.textContent = `导入后将覆盖配置组 ${index + 1} 当前的 ${group.buyers.length} 个买家。`;
    resetImportState();
    elements.importDialog.showModal();
  }

  function resetImportState() {
    importRows = [];
    elements.buyerFile.value = "";
    elements.importPreview.hidden = true;
    elements.importPreview.innerHTML = "";
    elements.importError.textContent = "";
    elements.confirmImport.disabled = true;
    elements.importDropzone.classList.remove("dragging");
  }

  function parseCsvLine(line) {
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (inQuotes && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  }

  function parseImportedBuyers(text) {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
    if (!lines.length) return [];
    const rows = lines.map(parseCsvLine);
    const firstRow = rows[0].join(" ").toLowerCase();
    if (/买家编号|buyer.?id/.test(firstRow) || /买家名称|buyer.?name/.test(firstRow)) rows.shift();

    const seenIds = new Set();
    const seenNames = new Set();
    const buyers = [];
    rows.forEach((row, index) => {
      const first = String(row[0] || "").trim();
      const second = String(row[1] || "").trim();
      let id = "";
      let name = "";
      if (row.length >= 2) {
        id = first;
        name = second;
      } else {
        name = first;
      }
      if (!name) return;
      if (!id) id = `IMP-${String(index + 1).padStart(3, "0")}`;
      const normalizedName = name.toLowerCase();
      if (seenIds.has(id) || seenNames.has(normalizedName)) return;
      seenIds.add(id);
      seenNames.add(normalizedName);
      const known = [...BUYER_DIRECTORY, ...state.customBuyers].find((buyer) => buyer.id === id || buyer.name === name);
      buyers.push(known
        ? cloneBuyer(known)
        : { id, name, company: "批量导入买家", tag: "导入" });
    });
    return buyers.slice(0, 2000);
  }

  async function handleImportFile(file) {
    elements.importError.textContent = "";
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) {
      elements.importError.textContent = "当前演示支持 CSV / TXT 文件，请使用模板整理后重试。";
      importRows = [];
      elements.importPreview.hidden = true;
      elements.confirmImport.disabled = true;
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      elements.importError.textContent = "文件不能超过 2MB，请拆分后重新导入。";
      return;
    }
    try {
      const text = await file.text();
      setImportRows(parseImportedBuyers(text), file.name);
    } catch (error) {
      elements.importError.textContent = "文件读取失败，请确认文件格式后重试。";
    }
  }

  function setImportRows(rows, sourceName = "演示文件") {
    importRows = rows;
    if (!rows.length) {
      elements.importError.textContent = "未识别到有效买家，请确认文件包含买家编号与名称。";
      elements.importPreview.hidden = true;
      elements.confirmImport.disabled = true;
      return;
    }
    elements.importError.textContent = "";
    elements.confirmImport.disabled = false;
    elements.importPreview.hidden = false;
    elements.importPreview.innerHTML = `
      <div class="import-preview-head"><strong>已解析 ${rows.length} 个买家</strong><span>${escapeHtml(sourceName)} · 预览前 5 条</span></div>
      <div class="import-table">
        <div class="import-row"><span>买家编号</span><span>买家名称</span><span>状态</span></div>
        ${rows.slice(0, 5).map((buyer) => `<div class="import-row"><span>${escapeHtml(buyer.id)}</span><span>${escapeHtml(buyer.name)}</span><span class="ok">有效</span></div>`).join("")}
      </div>`;
  }

  function confirmImport() {
    const group = findGroup(activeImportGroupId);
    if (!group || !importRows.length) return;
    const knownIds = new Set([...BUYER_DIRECTORY, ...state.customBuyers].map((buyer) => buyer.id));
    importRows.forEach((buyer) => {
      if (!knownIds.has(buyer.id)) {
        state.customBuyers.push(cloneBuyer(buyer));
        knownIds.add(buyer.id);
      }
    });
    group.buyers = importRows.map(cloneBuyer);
    elements.importDialog.close();
    clearValidation();
    renderGroups();
    markDirty();
    showToast(`已导入 ${group.buyers.length} 个买家`);
  }

  function createCsv(buyers, includeSamples = false) {
    const rows = ["买家编号,买家名称"];
    buyers.forEach((buyer) => {
      rows.push(`${csvCell(buyer.id)},${csvCell(buyer.name)}`);
    });
    if (includeSamples && !buyers.length) {
      rows.push("B-1001,华东优品", "B-1002,星河数码", "B-1003,极客换机");
    }
    return `\uFEFF${rows.join("\r\n")}`;
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function downloadCsv(filename, content) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportGroupBuyers(groupId) {
    const group = findGroup(groupId);
    if (!group) return;
    if (!group.buyers.length) {
      showToast("当前配置组还没有可导出的买家", "error");
      return;
    }
    const index = state.groups.findIndex((item) => item.id === groupId) + 1;
    downloadCsv(`配置组${index}-买家清单.csv`, createCsv(group.buyers));
    showToast(`已导出 ${group.buyers.length} 个买家`);
  }

  function addPriceTag(group, rawTag) {
    const tag = String(rawTag || "").trim().replace(/^#+/, "");
    if (!tag) return;
    if (tag.length > 16) {
      showToast("价格标签不能超过 16 个字符", "error");
      return;
    }
    if (group.priceTags.includes(tag)) {
      showToast("该价格标签已存在", "error");
      return;
    }
    if (group.priceTags.length >= 12) {
      showToast("每个配置组最多添加 12 个价格标签", "error");
      return;
    }
    group.priceTags.push(tag);
    clearValidation();
    renderGroups();
    markDirty();
  }

  function removePriceTag(group, tag) {
    group.priceTags = group.priceTags.filter((item) => item !== tag);
    clearValidation();
    renderGroups();
    markDirty();
  }

  function closeAllMenus(except = null) {
    elements.groupList.querySelectorAll(".multi-select").forEach((menu) => {
      if (menu === except) return;
      menu.querySelector(".select-trigger")?.setAttribute("aria-expanded", "false");
      const menuPanel = menu.querySelector(".select-menu");
      if (menuPanel) menuPanel.hidden = true;
    });
  }

  function updateMultiSelectUi(card, kind) {
    const group = findGroup(card.dataset.groupId);
    const options = kind === "channels" ? CHANNELS : BUYER_TYPES;
    const values = group[kind];
    const select = card.querySelector(`.multi-select[data-multi-kind="${kind}"]`);
    if (!select) return;
    const valueContainer = select.querySelector(".select-value");
    if (valueContainer) valueContainer.innerHTML = renderSelectedValues(values, options);
    const footer = select.querySelector(".select-menu-footer span");
    if (footer) footer.textContent = `已选 ${values.length} 项`;
    updateGroupTitle(card);
  }

  function updateGroupTitle(card) {
    const group = findGroup(card.dataset.groupId);
    const index = state.groups.findIndex((item) => item.id === group?.id);
    const title = card.querySelector(".group-panel-heading");
    if (!group || !title) return;
    const complete = hasRequiredGroupFields(group);
    title.innerHTML = `
      <span class="panel-eyebrow">正在编辑 · TAB ${String(index + 1).padStart(2, "0")}</span>
      <span class="group-title-line">
        <strong>配置组 ${index + 1}</strong>
        <span class="group-state${complete ? "" : " incomplete"}">${complete ? "已配置" : "待完善"}</span>
      </span>
      <span class="group-summary group-panel-summary">${escapeHtml(groupSummary(group))}</span>`;
    const tab = elements.groupList.querySelector(`#group-tab-${cssEscape(group.id)}`);
    if (tab) {
      tab.querySelector(".tab-copy small").textContent = tabSummary(group);
      updateGroupTabStatus(tab, group);
    }
  }

  function updateGroupTabStatus(tab, group) {
    const complete = hasRequiredGroupFields(group);
    tab.classList.toggle("is-incomplete", !complete);
    tab.setAttribute("aria-label", `${tab.querySelector(".tab-copy strong")?.textContent || "配置组"}，${complete ? "已配置" : "待完善"}`);
    tab.title = `${tab.querySelector(".tab-copy strong")?.textContent || "配置组"} · ${complete ? "已配置" : "待完善"}`;
  }

  function openPublishDialog() {
    if (validateForPublish() !== 0) return;
    const buyerTotal = uniqueCount(state.groups.flatMap((group) => group.buyers.map((buyer) => buyer.id)));
    elements.publishSummary.innerHTML = `
      <div><dt>配置名称</dt><dd>${escapeHtml(state.basic.name)}</dd></div>
      <div><dt>配置组</dt><dd>${state.groups.length} 组</dd></div>
      <div><dt>覆盖买家</dt><dd>${buyerTotal} 个</dd></div>
      <div><dt>价格规则</dt><dd>${state.groups.length} 组独立设置</dd></div>
      <div><dt>优先级</dt><dd>${escapeHtml(state.basic.priority)} 级</dd></div>`;
    elements.publishDialog.showModal();
  }

  function confirmPublish() {
    if (validateForPublish() !== 0) {
      elements.publishDialog.close();
      return;
    }
    const datePart = new Date();
    const stamp = `${datePart.getFullYear()}${String(datePart.getMonth() + 1).padStart(2, "0")}${String(datePart.getDate()).padStart(2, "0")}`;
    const suffix = String(Math.floor(Math.random() * 900) + 100);
    state.publishedId = `QCFG-${stamp}-${suffix}`;
    state.publishedAt = new Date().toISOString();
    state.savedAt = state.publishedAt;
    isSaved = true;
    isPublished = true;
    persistState();
    elements.pageStatus.textContent = "已发布";
    elements.pageStatus.className = "status-chip published";
    elements.savedState.textContent = "已发布";
    elements.publishDialog.close();
    elements.publishedId.textContent = state.publishedId;
    elements.successDialog.showModal();
  }

  function saveDraft() {
    syncBasicFromDom();
    state.savedAt = new Date().toISOString();
    state.publishedId = null;
    state.publishedAt = null;
    isSaved = true;
    isPublished = false;
    const persisted = persistState();
    elements.pageStatus.textContent = "草稿";
    elements.pageStatus.className = "status-chip saved";
    const time = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date(state.savedAt));
    elements.savedState.textContent = persisted ? `已保存 ${time}` : "当前会话已保存";
    showToast(persisted ? `草稿已保存到本地演示空间 · ${time}` : "草稿已保存在当前会话", persisted ? "success" : "error");
  }

  async function copyConfigId() {
    const value = elements.publishedId.textContent;
    try {
      await navigator.clipboard.writeText(value);
      showToast("配置编号已复制");
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      showToast(copied ? "配置编号已复制" : "复制失败，请手动选择配置编号", copied ? "success" : "error");
    }
  }

  function hydrateSavedUi() {
    if (state.publishedId) {
      elements.pageStatus.textContent = "已发布";
      elements.pageStatus.className = "status-chip published";
      elements.savedState.textContent = "已发布";
    } else if (state.savedAt) {
      const time = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date(state.savedAt));
      elements.pageStatus.textContent = "草稿";
      elements.pageStatus.className = "status-chip saved";
      elements.savedState.textContent = `已恢复 ${time}`;
    } else {
      elements.pageStatus.textContent = "未保存";
      elements.pageStatus.className = "status-chip";
      elements.savedState.textContent = "尚未保存";
    }
  }

  function bindEvents() {
    elements.form.addEventListener("submit", (event) => event.preventDefault());

    elements.form.addEventListener("input", (event) => {
      const target = event.target;
      const card = target.closest(".group-card");
      const group = findGroup(card?.dataset.groupId);
      if (group && target.matches("[data-group-price]")) {
        const priceField = target.dataset.groupPrice;
        if (Object.hasOwn(group.pricing, priceField)) group.pricing[priceField] = target.value;
        clearValidation();
        updateGroupTitle(card);
        markDirty();
        updateSummary();
        return;
      }
      if (group && target.matches("[data-fee-field]")) {
        const row = target.closest(".fee-row");
        const fee = group.fees.find((item) => item.id === row?.dataset.feeId);
        if (!fee) return;
        const feeField = target.dataset.feeField;
        if (feeField === "name" || feeField === "value" || feeField === "cap") fee[feeField] = target.value;
        clearValidation();
        updateGroupTitle(card);
        markDirty();
        updateSummary();
        return;
      }
      if (target.matches("[data-tag-input]")) return;
      if (target.id === "config-name") state.basic.name = target.value;
      else if (target.id === "config-description") {
        state.basic.description = target.value;
        updateDescriptionCount();
      } else if (target.id === "priority") state.basic.priority = target.value;
      else if (target.id === "expiry-date") state.basic.expiryDate = target.value;
      else return;
      clearValidation();
      markDirty();
      updateSummary();
    });

    elements.form.addEventListener("change", (event) => {
      const target = event.target;
      if (target.matches('input[name="status"]')) {
        state.basic.status = target.value;
        clearValidation();
        markDirty();
        updateSummary();
        return;
      }
      if (target.matches('[data-action="select-option"]')) {
        const card = target.closest(".group-card");
        const group = findGroup(card?.dataset.groupId);
        const kind = target.dataset.kind;
        if (!group || !kind) return;
        const selected = new Set(group[kind]);
        if (target.checked) selected.add(target.value);
        else selected.delete(target.value);
        group[kind] = [...selected];
        clearValidation();
        markDirty();
        updateMultiSelectUi(card, kind);
        updateSummary();
        return;
      }
      if (target.matches('[data-fee-field="type"]')) {
        const card = target.closest(".group-card");
        const group = findGroup(card?.dataset.groupId);
        const row = target.closest(".fee-row");
        const fee = group?.fees.find((item) => item.id === row?.dataset.feeId);
        if (!fee) return;
        fee.type = target.value === "ratio" ? "ratio" : "fixed";
        const unit = row.querySelector(".fee-unit");
        if (unit) unit.textContent = fee.type === "ratio" ? "%" : "元";
        clearValidation();
        updateGroupTitle(card);
        markDirty();
        updateSummary();
      }
    });

    elements.addGroup.addEventListener("click", addBlankGroup);
    elements.copyLastGroup.addEventListener("click", copyLastGroup);

    elements.groupList.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) return;
      const action = actionButton.dataset.action;
      if (action === "select-group") {
        selectGroup(actionButton.dataset.groupId);
        return;
      }
      if (action === "add-group-tab") {
        addBlankGroup();
        return;
      }
      const card = actionButton.closest(".group-card");
      const group = findGroup(card?.dataset.groupId);
      if (!group) return;

      if (action === "add-fee") {
        const fee = normalizeFee({
          name: `费用模块 ${group.fees.length + 1}`,
          type: "fixed",
          value: "",
          cap: ""
        });
        group.fees.push(fee);
        clearValidation();
        renderGroups();
        markDirty();
        requestAnimationFrame(() => {
          elements.groupList.querySelector(`[data-fee-id="${cssEscape(fee.id)}"] input[data-fee-field="value"]`)?.focus();
        });
      } else if (action === "remove-fee") {
        if (actionButton.disabled) return;
        group.fees = group.fees.filter((fee) => fee.id !== actionButton.dataset.feeId);
        clearValidation();
        renderGroups();
        markDirty();
        showToast("已删除当前配置组的费用规则");
      } else if (action === "copy-group") {
        copyGroup(group.id);
      } else if (action === "remove-group") {
        removeGroup(group.id);
      } else if (action === "pick-buyers") {
        openBuyerPicker(group.id);
      } else if (action === "remove-buyer") {
        group.buyers = group.buyers.filter((buyer) => buyer.id !== actionButton.dataset.buyerId);
        clearValidation();
        renderGroups();
        markDirty();
      } else if (action === "import-buyers") {
        openImportDialog(group.id);
      } else if (action === "download-buyer-template") {
        downloadCsv("配置组买家导入模板.csv", createCsv([], true));
        showToast("买家导入模板已下载");
      } else if (action === "export-buyers") {
        exportGroupBuyers(group.id);
      } else if (action === "toggle-menu") {
        const wrapper = actionButton.closest(".multi-select");
        const menu = wrapper.querySelector(".select-menu");
        const willOpen = menu.hidden;
        closeAllMenus(wrapper);
        menu.hidden = !willOpen;
        actionButton.setAttribute("aria-expanded", String(willOpen));
      } else if (action === "clear-options") {
        group[actionButton.dataset.kind] = [];
        clearValidation();
        renderGroups();
        markDirty();
      } else if (action === "add-tag") {
        addPriceTag(group, actionButton.dataset.tag);
      } else if (action === "remove-tag") {
        removePriceTag(group, actionButton.dataset.tag);
      }
    });

    elements.groupList.addEventListener("keydown", (event) => {
      const tab = event.target.closest('.group-tab');
      if (tab) {
        const tabs = [...elements.groupList.querySelectorAll('.group-tab')];
        const currentIndex = tabs.indexOf(tab);
        let nextIndex = null;
        if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
        else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex !== null) {
          event.preventDefault();
          const nextTab = tabs[nextIndex];
          activeGroupId = nextTab.dataset.groupId;
          renderGroups();
          requestAnimationFrame(() => {
            elements.groupList.querySelector(`#group-tab-${cssEscape(activeGroupId)}`)?.focus({ preventScroll: true });
          });
        }
        return;
      }

      const input = event.target.closest("[data-tag-input]");
      if (!input) return;
      if (event.key === "Enter" || event.key === "," || event.key === "，") {
        event.preventDefault();
        const card = input.closest(".group-card");
        const group = findGroup(card?.dataset.groupId);
        const value = input.value;
        input.value = "";
        if (group) addPriceTag(group, value);
      }
    });

    elements.groupList.addEventListener("focusout", (event) => {
      const input = event.target.closest("[data-tag-input]");
      if (!input || !input.value.trim()) return;
      const card = input.closest(".group-card");
      const group = findGroup(card?.dataset.groupId);
      const value = input.value;
      input.value = "";
      if (!group) return;
      if (event.relatedTarget instanceof Element && event.relatedTarget.closest('[role="tab"]')) {
        window.setTimeout(() => addPriceTag(group, value), 0);
      } else {
        addPriceTag(group, value);
      }
    });

    elements.groupList.addEventListener("mousedown", (event) => {
      if (event.target.closest('[data-action="add-tag"]')) event.preventDefault();
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".multi-select")) closeAllMenus();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAllMenus();
    });

    elements.buyerSearch.addEventListener("input", renderBuyerPicker);

    elements.buyerList.addEventListener("change", (event) => {
      const checkbox = event.target.closest('input[type="checkbox"]');
      if (!checkbox) return;
      const option = checkbox.closest(".buyer-option");
      const group = findGroup(activeBuyerGroupId);
      const buyer = getAvailableBuyers(group).find((item) => item.id === checkbox.value);
      if (!buyer) return;
      if (checkbox.checked) buyerDraft.set(buyer.id, buyer);
      else buyerDraft.delete(buyer.id);
      option.classList.toggle("selected", checkbox.checked);
      updateBuyerPickerCount();
    });

    elements.applyBuyers.addEventListener("click", applyBuyerSelection);

    elements.selectFile.addEventListener("click", () => elements.buyerFile.click());
    elements.buyerFile.addEventListener("change", () => handleImportFile(elements.buyerFile.files[0]));

    ["dragenter", "dragover"].forEach((type) => {
      elements.importDropzone.addEventListener(type, (event) => {
        event.preventDefault();
        elements.importDropzone.classList.add("dragging");
      });
    });
    ["dragleave", "drop"].forEach((type) => {
      elements.importDropzone.addEventListener(type, (event) => {
        event.preventDefault();
        elements.importDropzone.classList.remove("dragging");
      });
    });
    elements.importDropzone.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (file) handleImportFile(file);
    });

    elements.downloadTemplate.addEventListener("click", () => {
      downloadCsv("配置组买家导入模板.csv", createCsv([], true));
      showToast("买家导入模板已下载");
    });
    elements.loadDemoBuyers.addEventListener("click", () => {
      const demoRows = [BUYER_DIRECTORY[0], BUYER_DIRECTORY[1], BUYER_DIRECTORY[5]].map(cloneBuyer);
      setImportRows(demoRows, "买家导入模板-演示.csv");
    });
    elements.confirmImport.addEventListener("click", confirmImport);

    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => {
        const dialog = document.getElementById(button.dataset.closeDialog);
        dialog?.close();
      });
    });

    [elements.buyerDialog, elements.importDialog, elements.publishDialog].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    });

    elements.publishDialog.addEventListener("close", () => {
      if (!elements.successDialog.open) document.querySelector("#publish-config")?.focus({ preventScroll: true });
    });

    document.querySelector("#publish-config").addEventListener("click", openPublishDialog);
    document.querySelector("#mobile-publish").addEventListener("click", openPublishDialog);
    document.querySelector("#save-draft").addEventListener("click", saveDraft);
    document.querySelector("#mobile-save-draft").addEventListener("click", saveDraft);
    elements.confirmPublish.addEventListener("click", confirmPublish);
    elements.copyConfigId.addEventListener("click", copyConfigId);

    window.addEventListener("beforeunload", () => {
      syncBasicFromDom();
    });
  }

  function init() {
    hydrateBasicFields();
    renderGroups();
    hydrateSavedUi();
    bindEvents();
  }

  init();
})();
