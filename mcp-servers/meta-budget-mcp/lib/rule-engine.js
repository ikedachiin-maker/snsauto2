// ── Automated Budget Rule Engine ────────────────────────────────────

import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";
import { OPERATORS, RULE_ACTIONS, METRICS, EVAL_WINDOWS } from "./config.js";

const RULES_DIR = join(import.meta.dirname, "..", "rules");

// ── Rule CRUD ───────────────────────────────────────────────────────

export function createRule({
  name,
  description,
  target_level = "adset",
  conditions,
  action,
  evaluation_window = "last_7d",
  max_executions_per_day = 1,
  enabled = true,
}) {
  // Validate conditions
  for (const cond of conditions) {
    if (!METRICS[cond.metric]) {
      throw new Error(`Unknown metric: "${cond.metric}". Valid: ${Object.keys(METRICS).join(", ")}`);
    }
    if (!OPERATORS[cond.operator]) {
      throw new Error(`Unknown operator: "${cond.operator}". Valid: ${Object.keys(OPERATORS).join(", ")}`);
    }
    if (cond.value == null) {
      throw new Error(`Condition value is required for metric "${cond.metric}"`);
    }
  }

  // Validate action
  if (!RULE_ACTIONS[action.type]) {
    throw new Error(`Unknown action: "${action.type}". Valid: ${Object.keys(RULE_ACTIONS).join(", ")}`);
  }
  const actionDef = RULE_ACTIONS[action.type];
  if (actionDef.requires === "percent" && !action.percent) {
    throw new Error(`Action "${action.type}" requires a "percent" value`);
  }
  if (actionDef.requires === "amount" && !action.amount) {
    throw new Error(`Action "${action.type}" requires an "amount" value`);
  }
  if (actionDef.requires === "strategy" && !action.strategy) {
    throw new Error(`Action "${action.type}" requires a "strategy" value`);
  }

  // Validate eval window
  if (!EVAL_WINDOWS[evaluation_window]) {
    throw new Error(`Unknown window: "${evaluation_window}". Valid: ${Object.keys(EVAL_WINDOWS).join(", ")}`);
  }

  const rule = {
    id: `rule_${Date.now()}`,
    name,
    description: description || "",
    target_level,
    conditions,
    action,
    evaluation_window,
    max_executions_per_day,
    enabled,
    created_at: new Date().toISOString(),
    last_evaluated: null,
    execution_count: 0,
  };

  // Save to disk
  const filePath = join(RULES_DIR, `${rule.id}.json`);
  writeFileSync(filePath, JSON.stringify(rule, null, 2), "utf-8");

  return rule;
}

export function listRules() {
  if (!existsSync(RULES_DIR)) return [];
  const files = readdirSync(RULES_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const data = JSON.parse(readFileSync(join(RULES_DIR, f), "utf-8"));
    return data;
  });
}

export function getRule(ruleId) {
  const filePath = join(RULES_DIR, `${ruleId}.json`);
  if (!existsSync(filePath)) throw new Error(`Rule not found: ${ruleId}`);
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

export function deleteRule(ruleId) {
  const filePath = join(RULES_DIR, `${ruleId}.json`);
  if (!existsSync(filePath)) throw new Error(`Rule not found: ${ruleId}`);
  unlinkSync(filePath);
  return { deleted: ruleId };
}

export function updateRule(ruleId, updates) {
  const rule = getRule(ruleId);
  const updated = { ...rule, ...updates, id: ruleId };
  const filePath = join(RULES_DIR, `${ruleId}.json`);
  writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

// ── Rule Evaluation ─────────────────────────────────────────────────

// Extract a metric value from Insights API response
function extractMetric(insightsRow, metric) {
  switch (metric) {
    case "spend":
      return parseFloat(insightsRow.spend || 0);
    case "impressions":
      return parseInt(insightsRow.impressions || 0);
    case "clicks":
      return parseInt(insightsRow.clicks || 0);
    case "ctr":
      return parseFloat(insightsRow.ctr || 0);
    case "cpc":
      return parseFloat(insightsRow.cpc || 0);
    case "cpm":
      return parseFloat(insightsRow.cpm || 0);
    case "frequency":
      return parseFloat(insightsRow.frequency || 0);
    case "conversions": {
      const actions = insightsRow.actions || [];
      const purchase = actions.find(
        (a) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
      );
      const lead = actions.find((a) => a.action_type === "lead");
      return parseInt(purchase?.value || lead?.value || 0);
    }
    case "cpa": {
      const costs = insightsRow.cost_per_action_type || [];
      const cpaPurchase = costs.find(
        (c) => c.action_type === "purchase" || c.action_type === "offsite_conversion.fb_pixel_purchase"
      );
      const cpaLead = costs.find((c) => c.action_type === "lead");
      return parseFloat(cpaPurchase?.value || cpaLead?.value || 0);
    }
    case "roas": {
      const roasArr = insightsRow.purchase_roas || [];
      return parseFloat(roasArr[0]?.value || 0);
    }
    default:
      return 0;
  }
}

// Check if a condition is met
function evaluateCondition(condition, metricValue) {
  const { operator, value } = condition;
  switch (operator) {
    case "gt": return metricValue > value;
    case "gte": return metricValue >= value;
    case "lt": return metricValue < value;
    case "lte": return metricValue <= value;
    case "eq": return metricValue === value;
    default: return false;
  }
}

// Evaluate a rule against insights data for one object
export function evaluateRule(rule, insightsRow) {
  const results = rule.conditions.map((cond) => {
    const metricValue = extractMetric(insightsRow, cond.metric);
    const passed = evaluateCondition(cond, metricValue);
    return {
      metric: cond.metric,
      metric_label: METRICS[cond.metric]?.label || cond.metric,
      operator: OPERATORS[cond.operator]?.label || cond.operator,
      threshold: cond.value,
      actual: metricValue,
      passed,
    };
  });

  const allPassed = results.every((r) => r.passed);

  return {
    rule_id: rule.id,
    rule_name: rule.name,
    target_id: insightsRow.adset_id || insightsRow.campaign_id || insightsRow.ad_id,
    target_name: insightsRow.adset_name || insightsRow.campaign_name || insightsRow.ad_name,
    conditions_evaluated: results,
    all_conditions_met: allPassed,
    recommended_action: allPassed ? rule.action : null,
  };
}

// Build the API call for a rule action
export function buildActionApiCall(rule, targetId, currentBudget) {
  const { action } = rule;
  const actionDef = RULE_ACTIONS[action.type];

  switch (action.type) {
    case "pause":
    case "activate":
      return {
        endpoint: targetId,
        params: { [actionDef.api_field]: actionDef.api_value },
        description: actionDef.description,
      };

    case "increase_budget": {
      const newBudget = Math.round(currentBudget * (1 + action.percent / 100));
      return {
        endpoint: targetId,
        params: { daily_budget: String(newBudget) },
        description: `${actionDef.description}: ${currentBudget} → ${newBudget} (+${action.percent}%)`,
      };
    }

    case "decrease_budget": {
      const newBudget = Math.round(currentBudget * (1 - action.percent / 100));
      return {
        endpoint: targetId,
        params: { daily_budget: String(newBudget) },
        description: `${actionDef.description}: ${currentBudget} → ${newBudget} (-${action.percent}%)`,
      };
    }

    case "set_budget":
      return {
        endpoint: targetId,
        params: { daily_budget: String(action.amount) },
        description: `${actionDef.description}: → ${action.amount}`,
      };

    case "change_bid_strategy":
      return {
        endpoint: targetId,
        params: { bid_strategy: action.strategy },
        description: `${actionDef.description}: → ${action.strategy}`,
      };

    case "notify":
      return {
        endpoint: null,
        params: null,
        description: actionDef.description,
      };

    default:
      return null;
  }
}

// Format a human-readable rule summary
export function formatRuleSummary(rule) {
  const condStr = rule.conditions
    .map((c) => {
      const m = METRICS[c.metric]?.label || c.metric;
      const op = OPERATORS[c.operator]?.label || c.operator;
      return `${m} ${op} ${c.value}`;
    })
    .join(" AND ");

  const actionStr = RULE_ACTIONS[rule.action.type]?.description || rule.action.type;
  const detail =
    rule.action.percent ? ` (${rule.action.percent}%)` :
    rule.action.amount ? ` (${rule.action.amount})` :
    rule.action.strategy ? ` (${rule.action.strategy})` : "";

  return `IF ${condStr} THEN ${actionStr}${detail} [${EVAL_WINDOWS[rule.evaluation_window]?.label || rule.evaluation_window}]`;
}
