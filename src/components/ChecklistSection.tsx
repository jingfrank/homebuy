import React, { useState } from "react";
import { BookOpenIcon, CheckCircleIcon, ShieldCheckIcon } from "./Icons";

interface ChecklistCategory {
  title: string;
  items: { text: string; detail: string }[];
}

const checklistCategories: ChecklistCategory[] = [
  {
    title: "阶段一：看房选房与资金准备",
    items: [
      {
        text: "保留至少6个月必要生活费及房贷备用金",
        detail: "切勿将存款全部作为首付付清，务必预留6-12个月应急资金。",
      },
      {
        text: "核实个人征信报告与首套房认定资格",
        detail: "看房前提前拉取征信，确认信用卡逾期记录及房贷利率优惠资格。",
      },
      {
        text: "实地考察早晚高峰交通与物业管理水平",
        detail: "雨天看是否有渗水漏水，工作日夜晚看小区车位及物业巡逻防范。",
      },
    ],
  },
  {
    title: "阶段二：看盘议价与合同签署",
    items: [
      {
        text: "对比周边次新二手房成交价与挂牌价差额",
        detail:
          "挂牌价往往虚高5%-15%，参考真实成交底价（可通过中介历史成交打听）。",
      },
      {
        text: "利用‘风险折价因子’剔除瑕疵溢价",
        detail:
          "若存在房龄偏老、临高架噪音、无轨交或车位紧张，必须要求房东给予 6% ~ 25% 的价格折价让利。",
      },
      {
        text: "定金条款明确“若房贷审批不通过退还定金”",
        detail:
          "在认购书上增加补充协议，防范不可抗力或银行限贷导致定金被扣留。",
      },
      {
        text: "核验二手房房产证原件、房屋抵押与户口迁出",
        detail: "确保房屋无查封、无未结清民间借贷，并约定原户口限期迁出责任。",
      },
    ],
  },
  {
    title: "阶段三：隐形成本盘算与交房验房",
    items: [
      {
        text: "预算契税、维修基金、中介费与装修开支",
        detail:
          "契税1%、维修基金、中介费1.5%-2.5%、简装:10~16万，1100~1300元/m²。",
      },
      {
        text: "验房重点检测防水、空鼓、墙体裂缝与管线",
        detail: "带好验房工具或请专业验房师，排查漏水与电路接地安全。",
      },
    ],
  },
];

export const ChecklistSection: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Interactive Risk Discount Calculator State
  const [calcPriceWuan, setCalcPriceWuan] = useState<number>(500);
  const [riskAge, setRiskAge] = useState<boolean>(false);
  const [riskLayoutNoise, setRiskLayoutNoise] = useState<boolean>(false);
  const [riskParking, setRiskParking] = useState<boolean>(false);
  const [riskMetro, setRiskMetro] = useState<boolean>(false);
  const [riskSchool, setRiskSchool] = useState<boolean>(false);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Compute Discount
  let discountPct = 0;
  if (riskAge) discountPct += 10;
  if (riskLayoutNoise) discountPct += 10;
  if (riskParking) discountPct += 6;
  if (riskMetro) discountPct += 8;
  if (riskSchool) discountPct += 15;

  discountPct = Math.min(35, discountPct);
  const discountWuan = Math.round(((calcPriceWuan * discountPct) / 100) * 10) / 10;
  const safeTargetPriceWuan = Math.round((calcPriceWuan - discountWuan) * 10) / 10;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Header */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <BookOpenIcon color="var(--success)" size={24} />
          <h2
            style={{
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "var(--text-main)",
            }}
          >
            买房踩坑避雷手册与全流程 CheckList
          </h2>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
          从准备首付、谈判砍价到合同补充协议、验房交房的全套风控清单。
        </p>
      </div>

      {/* Interactive Risk Discount Calculator Card (NEW FEATURE) */}
      <div
        className="glass-card"
        style={{
          padding: "24px",
          border: "1px solid rgba(220, 38, 38, 0.3)",
          background: "linear-gradient(135deg, #ffffff 0%, rgba(254, 242, 242, 0.8) 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <ShieldCheckIcon color="var(--danger)" size={22} />
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--danger)" }}>
            🛡️ 房产风险折价因子与理性安全入手价试算器
          </h3>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
          输入意向房源挂牌价，勾选房屋潜在瑕疵，系统自动帮您测算应该要求房东给予的价格折价安全垫。
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                房源挂牌总价 (万元)
              </label>
              <input
                type="number"
                value={calcPriceWuan}
                onChange={(e) => setCalcPriceWuan(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--danger)", display: "block", marginBottom: "6px" }}>
                勾选房屋存在瑕疵/风险项：
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.825rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={riskAge} onChange={(e) => setRiskAge(e.target.checked)} />
                  🏢 房龄偏老 (&gt;20年，贷款受限/缺乏人车分流) <strong style={{ color: "var(--danger)" }}>-10%</strong>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={riskLayoutNoise} onChange={(e) => setRiskLayoutNoise(e.target.checked)} />
                  📐 顶底楼 / 临高架主干道噪音 / 暗卫瑕疵 <strong style={{ color: "var(--danger)" }}>-10%</strong>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={riskParking} onChange={(e) => setRiskParking(e.target.checked)} />
                  🚗 车位极度紧张 (车位比&lt;0.6) / 物业管理差 <strong style={{ color: "var(--danger)" }}>-6%</strong>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={riskMetro} onChange={(e) => setRiskMetro(e.target.checked)} />
                  🚇 远郊孤岛 / 离轨交站 &gt; 1.5 公里 <strong style={{ color: "var(--danger)" }}>-8%</strong>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={riskSchool} onChange={(e) => setRiskSchool(e.target.checked)} />
                  🎓 学区划片变动风险 / 高额学区溢价剥离 <strong style={{ color: "var(--danger)" }}>-15%</strong>
                </label>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div
            style={{
              background: "#ffffff",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid rgba(220, 38, 38, 0.25)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "12px",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.05)",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
              <span>综合风险折价比例：</span>
              <span style={{ fontWeight: 800, color: "var(--danger)", fontSize: "1.1rem" }}>-{discountPct}%</span>
            </div>

            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
              <span>建议砍价让利空间：</span>
              <span style={{ fontWeight: 800, color: "var(--warning)", fontSize: "1.1rem" }}>{discountWuan} 万元</span>
            </div>

            <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "10px", marginTop: "4px" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>理性安全入手目标价：</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--danger)" }}>
                {safeTargetPriceWuan} <span style={{ fontSize: "0.9rem" }}>万元</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "4px" }}>
                高于 {safeTargetPriceWuan} 万可能面临瑕疵溢价风险，建议以此底价进行谈判谈判。
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist categories */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {checklistCategories.map((cat, catIdx) => (
          <div key={catIdx} className="glass-card" style={{ padding: "24px" }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: "16px",
                color: "var(--primary)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                paddingBottom: "10px",
              }}
            >
              {cat.title}
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {cat.items.map((item, itemIdx) => {
                const id = `${catIdx}-${itemIdx}`;
                const isChecked = !!checkedItems[id];
                return (
                  <div
                    key={id}
                    onClick={() => toggleCheck(id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "14px",
                      padding: "14px",
                      borderRadius: "var(--radius-sm)",
                      background: isChecked
                        ? "rgba(16, 185, 129, 0.08)"
                        : "rgba(255, 255, 255, 0.03)",
                      border: isChecked
                        ? "1px solid rgba(16, 185, 129, 0.3)"
                        : "1px solid rgba(255, 255, 255, 0.06)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "6px",
                        border: isChecked
                          ? "none"
                          : "2px solid var(--text-dim)",
                        background: isChecked
                          ? "var(--success)"
                          : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "2px",
                        flexShrink: 0,
                      }}
                    >
                      {isChecked && (
                        <CheckCircleIcon size={16} color="#ffffff" />
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: isChecked
                            ? "var(--success)"
                            : "var(--text-main)",
                          textDecoration: isChecked ? "line-through" : "none",
                        }}
                      >
                        {item.text}
                      </div>
                      <div
                        style={{
                          fontSize: "0.825rem",
                          color: "var(--text-muted)",
                          marginTop: "4px",
                        }}
                      >
                        {item.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
