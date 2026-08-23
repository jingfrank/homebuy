import React, { useState } from "react";
import type { UserInputData, PredictionAssessment } from "../types/prediction";
import { evaluateHomePurchaseTiming } from "../utils/calculator";
import { ScoreGauge } from "./ScoreGauge";
import {
  DollarSignIcon,
  HomeIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  PrinterIcon,
} from "./Icons";

const STORAGE_WIZARD_KEY = "homebuy_assessment_wizard_v1";

const defaultInputs: UserInputData = {
  annualIncome: 37.5, // 万/年
  currentSavings: 40, //万
  targetHousePrice: 240, // 240万
  monthlyDebt: 0, // 0
  monthlyRent: 3800, // 3800/月
  careerStability: "high",
  emergencyReserveMonths: 6,
  purpose: "first_home",
  hasUrgentNeedIn2Years: true,
  cityTier: "new_tier1",
  downPaymentRatio: 0.2, // 20%
  mortgageRate: 3.15, // 3.15%
  loanTermYears: 30,
  inventoryCycleMonths: 18,
  priceNegotiationSpace: "high",
};

function getStoredInputs(): UserInputData {
  try {
    const raw = localStorage.getItem(STORAGE_WIZARD_KEY);
    if (!raw) return defaultInputs;
    const parsed = JSON.parse(raw);
    return { ...defaultInputs, ...parsed };
  } catch {
    return defaultInputs;
  }
}

export const AssessmentWizard: React.FC = () => {
  const [inputs, setInputs] = useState<UserInputData>(() => getStoredInputs());
  const [assessment, setAssessment] = useState<PredictionAssessment>(() =>
    evaluateHomePurchaseTiming(inputs),
  );

  const handleInputChange = (field: keyof UserInputData, value: any) => {
    const updated = { ...inputs, [field]: value };
    setInputs(updated);
    setAssessment(evaluateHomePurchaseTiming(updated));

    try {
      localStorage.setItem(STORAGE_WIZARD_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save assessment inputs to localStorage", e);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Top Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: "28px",
          background:
            "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)",
          borderLeft: "5px solid var(--primary)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <SparklesIcon color="var(--accent-cyan)" size={24} />
          <h2
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "var(--text-main)",
            }}
          >
            智能买房时机多维度诊断系统
          </h2>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          结合您的财务安全防线、目标城市楼市供需周期、房贷利率及刚需迫切度，全方位测算“当下是否适合买房”。
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "28px",
        }}
      >
        {/* Left Column: Form Inputs */}
        <div className="glass-card" style={{ padding: "28px" }}>
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              paddingBottom: "12px",
            }}
          >
            <DollarSignIcon color="var(--primary)" size={20} />
            1. 个人财务与资金储备
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          >
            <div>
              <label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                家庭年总可支配收入（万元/年）
              </label>
              <input
                type="number"
                value={inputs.annualIncome}
                onChange={(e) =>
                  handleInputChange(
                    "annualIncome",
                    parseFloat(e.target.value) || 0,
                  )
                }
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                折合月收入: {((inputs.annualIncome * 10000) / 12).toFixed(0)}{" "}
                元/月
              </span>
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                当前可动用现金储蓄（万元）
              </label>
              <input
                type="number"
                value={inputs.currentSavings}
                onChange={(e) =>
                  handleInputChange(
                    "currentSavings",
                    parseFloat(e.target.value) || 0,
                  )
                }
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                包含存款、理财等可快速变现资金
              </span>
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                期望购买房屋总价（万元）
              </label>
              <input
                type="number"
                value={inputs.targetHousePrice}
                onChange={(e) =>
                  handleInputChange(
                    "targetHousePrice",
                    parseFloat(e.target.value) || 0,
                  )
                }
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  首付比例
                </label>
                <select
                  value={inputs.downPaymentRatio}
                  onChange={(e) =>
                    handleInputChange(
                      "downPaymentRatio",
                      parseFloat(e.target.value),
                    )
                  }
                >
                  <option value={0.15}>15% (最低首付)</option>
                  <option value={0.2}>20% (常见首付)</option>
                  <option value={0.3}>30% (三成首付)</option>
                  <option value={0.4}>40% (四成首付)</option>
                  <option value={0.5}>50% (半数首付)</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  职业/行业稳定性
                </label>
                <select
                  value={inputs.careerStability}
                  onChange={(e) =>
                    handleInputChange("careerStability", e.target.value)
                  }
                >
                  <option value="high">高 (体制内/国央企/稳健高管)</option>
                  <option value="medium">中 (成熟企业/稳健行业)</option>
                  <option value="low">低 (波动的创业/高替换风险行业)</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  非房月负债（元/月）
                </label>
                <input
                  type="number"
                  value={inputs.monthlyDebt}
                  onChange={(e) =>
                    handleInputChange(
                      "monthlyDebt",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  当前月租金支出（元/月）
                </label>
                <input
                  type="number"
                  value={inputs.monthlyRent}
                  onChange={(e) =>
                    handleInputChange(
                      "monthlyRent",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
              </div>
            </div>

            {/* Section 2: Need & Market */}
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                marginTop: "12px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                paddingBottom: "12px",
              }}
            >
              <HomeIcon color="var(--accent-cyan)" size={20} />
              2. 刚需用途与目标楼市环境
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  主要购房目的
                </label>
                <select
                  value={inputs.purpose}
                  onChange={(e) => handleInputChange("purpose", e.target.value)}
                >
                  <option value="first_home">自住无房刚需</option>
                  <option value="marriage">结婚置业强需</option>
                  <option value="education">孩子入学/学区</option>
                  <option value="upgrade">改善置业/换房</option>
                  <option value="investment">资产配置/投资</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  目标城市类型
                </label>
                <select
                  value={inputs.cityTier}
                  onChange={(e) =>
                    handleInputChange("cityTier", e.target.value)
                  }
                >
                  <option value="tier1">一线城市 (北/沪/深/穗)</option>
                  <option value="new_tier1">新一线 (杭/蓉/汉/苏/宁等)</option>
                  <option value="tier2">强二线城市</option>
                  <option value="tier3_4">三四线城市/县城</option>
                </select>
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                预估房贷利率 (年化 %)
              </label>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <input
                  type="number"
                  step="0.05"
                  value={inputs.mortgageRate}
                  onChange={(e) =>
                    handleInputChange(
                      "mortgageRate",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--accent-cyan)",
                    whiteSpace: "nowrap",
                  }}
                >
                  目前5年期以上LPR基准
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  目标板块去化周期
                </label>
                <select
                  value={inputs.inventoryCycleMonths}
                  onChange={(e) =>
                    handleInputChange(
                      "inventoryCycleMonths",
                      parseInt(e.target.value),
                    )
                  }
                >
                  <option value={8}>小于12个月 (紧俏供不应求)</option>
                  <option value={15}>12-18个月 (供需平衡)</option>
                  <option value={24}>大于18个月 (典型买方市场)</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  业主/开发商议价空间
                </label>
                <select
                  value={inputs.priceNegotiationSpace}
                  onChange={(e) =>
                    handleInputChange("priceNegotiationSpace", e.target.value)
                  }
                >
                  <option value="high">大 (&gt;8% 砍价空间)</option>
                  <option value="medium">中 (5-8% 砍价空间)</option>
                  <option value="low">小 (&lt;5% 态度坚挺)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Assessment Result Dashboard */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Gauge & Main Conclusion */}
          <ScoreGauge
            score={assessment.totalScore}
            signal={assessment.recommendationSignal}
            title={assessment.recommendationTitle}
          />

          {/* Quick Metrics Bar */}
          <div
            className="glass-card"
            style={{
              padding: "20px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                预估月供
              </div>
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--primary)",
                }}
              >
                {assessment.mortgage.monthlyPayment}{" "}
                <span style={{ fontSize: "0.8rem" }}>元/月</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                月供收入比 (DTI)
              </div>
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color:
                    assessment.mortgage.dtiRatio <= 40
                      ? "var(--success)"
                      : "var(--warning)",
                }}
              >
                {assessment.mortgage.dtiRatio}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                购房后剩余现金
              </div>
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color:
                    assessment.mortgage.remainingReserve >= 0
                      ? "var(--accent-cyan)"
                      : "var(--danger)",
                }}
              >
                {assessment.mortgage.remainingReserve}{" "}
                <span style={{ fontSize: "0.8rem" }}>万元</span>
              </div>
            </div>
          </div>

          {/* 3 Key Dimension Breakdown */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h4
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                marginBottom: "16px",
                color: "var(--text-main)",
              }}
            >
              三大核心评估维度得分
            </h4>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Financial Dimension */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                    💰 {assessment.dimensions.financial.name} (权重45%)
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        assessment.dimensions.financial.score >= 75
                          ? "var(--success)"
                          : "var(--warning)",
                    }}
                  >
                    {assessment.dimensions.financial.score}分
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${assessment.dimensions.financial.score}%`,
                      background:
                        assessment.dimensions.financial.score >= 75
                          ? "var(--success)"
                          : "var(--warning)",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <ul
                  style={{
                    paddingLeft: "18px",
                    marginTop: "8px",
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {assessment.dimensions.financial.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              {/* Market Dimension */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                    📈 {assessment.dimensions.market.name} (权重30%)
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        assessment.dimensions.market.score >= 70
                          ? "var(--success)"
                          : "var(--warning)",
                    }}
                  >
                    {assessment.dimensions.market.score}分
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${assessment.dimensions.market.score}%`,
                      background: "var(--accent-cyan)",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <ul
                  style={{
                    paddingLeft: "18px",
                    marginTop: "8px",
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {assessment.dimensions.market.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              {/* Need Dimension */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                    🏠 {assessment.dimensions.need.name} (权重25%)
                  </span>
                  <span
                    style={{ fontWeight: 700, color: "var(--accent-purple)" }}
                  >
                    {assessment.dimensions.need.score}分
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${assessment.dimensions.need.score}%`,
                      background: "var(--accent-purple)",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <ul
                  style={{
                    paddingLeft: "18px",
                    marginTop: "8px",
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {assessment.dimensions.need.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Plan & Key Risks Card */}
      <div className="glass-card" style={{ padding: "28px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h3
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <ShieldCheckIcon color="var(--success)" size={22} />
            定制化买房决策建议与风险提示
          </h3>
          <button className="btn btn-secondary" onClick={handlePrintReport}>
            <PrinterIcon size={16} /> 打印/导出个人评估报告
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Key Risks */}
          <div
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              borderRadius: "var(--radius-sm)",
              padding: "20px",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <h4
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--danger)",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertTriangleIcon size={18} /> 关键避坑与风险控制点
            </h4>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {assessment.keyRisks.map((risk, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-main)",
                    lineHeight: 1.5,
                  }}
                >
                  {risk}
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div
            style={{
              background: "rgba(99, 102, 241, 0.08)",
              borderRadius: "var(--radius-sm)",
              padding: "20px",
              border: "1px solid rgba(99, 102, 241, 0.2)",
            }}
          >
            <h4
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--primary)",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircleIcon size={18} /> 建议买房行动路径 (
              {assessment.optimalTimeWindow})
            </h4>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {assessment.actionItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-main)",
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                    {idx + 1}.
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
