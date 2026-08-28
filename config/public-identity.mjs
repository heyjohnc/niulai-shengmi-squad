export const PRODUCT = Object.freeze({
  displayName: "牛来生米小队",
  englishName: "Niulai Shengmi Squad",
  navigationLabel: "唯一时间线",
  description: "四个角色先独立随机投票，再把纸面结果和回旋镖留在一条可验证时间线上。"
});

export const AGENTS = Object.freeze([
  Object.freeze({ id: "YUNQUE", name: "云雀", duty: "候选卡与证据分层", color: "#f9734f" }),
  Object.freeze({ id: "NIULAI", name: "牛来", duty: "纸面开仓与结果回写", color: "#f4c95d" }),
  Object.freeze({ id: "NIULAI_MAMA", name: "牛来妈妈", duty: "时间线整理与角色接话", color: "#8ed4c6" }),
  Object.freeze({ id: "BAOLA", name: "豹拉", duty: "反证、开放问题与回旋镖", color: "#9aa7ff" })
]);

export const AGENT_IDS = Object.freeze(AGENTS.map((agent) => agent.id));

export function agentById(id) {
  const agent = AGENTS.find((item) => item.id === id);
  if (!agent) throw new Error(`UNKNOWN_AGENT:${id}`);
  return agent;
}
