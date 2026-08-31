import React, { useState } from "react";
import { CheckCircleIcon, ShieldCheckIcon } from "./Icons";

interface ChecklistCategory {
  title: string;
  badge: string;
  items: { text: string; detail: string; warning?: boolean }[];
}

const CHECKLIST_STORAGE_KEY = "homebuy_checklist_checked_v2";

function getStoredChecked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const checklistCategories: ChecklistCategory[] = [
  {
    title: "阶段一：看房选房与资金/资质风控",
    badge: "前期准备",
    items: [
      {
        text: "保留至少 6 ~ 12 个月必要生活费及房贷月供备用金",
        detail: "切勿将手头存款全部作为首付付清，务必预留紧急备用金，防范失业或收入波动导致断供。",
        warning: true,
      },
      {
        text: "提前拉取个人征信报告与核实上海购房资格",
        detail: "确认公积金缴存连续性、信用卡有无逾期记录、是否存在未结清消费贷/经营贷影响房贷审批及利率优惠。",
      },
      {
        text: "雨天与工作日夜晚实地考察小区实况",
        detail: "大雨天排查外墙、顶楼、窗框是否有渗水水渍及地下车库排风积水；工作日晚间实测小区车位饱和度与抢车位实况。",
      },
      {
        text: "核验真实得房率与梯户比（警惕高摊公摊单价失真）",
        detail: "高层住宅得房率通常在 70%~75% 左右，老公房与多层可达 80%~85% 以上，按实际套内可用面积折算真实单价。",
      },
    ],
  },
  {
    title: "阶段二：上海二手房税费核验与转嫁避坑（核心大头）",
    badge: "税费避坑",
    items: [
      {
        text: "核实「满五唯一」真实性并在合同中增加房东兜底承诺条款",
        detail: "上海交易习惯通常约定‘房东净手到手价’（个税由买家承担）。签约前必须要求房东提供产证原件及在沪唯一住房核查证明，并明确约定：若因房东家庭原因无法享受满五唯一免个税，所产生的个人所得税由房东全额自行承担！",
        warning: true,
      },
      {
        text: "核实「满2年」起算时间点（防范 5.3% 巨额增值税）",
        detail: "起算点以『不动产权证发证日期』或『契税完税证明（税票）填发日期』孰先原则确定。必须精确到具体日期，若差几个月满2年，需承担约 5.03% 的全额增值税，500万房产税费直接多出 25 万元！",
        warning: true,
      },
      {
        text: "索要房东原始买入发票（核定 1% vs 查账 20% 个税差额核算）",
        detail: "若房源不满五唯一，需核实是按计税核税价的 1% 核定征收个税，还是按差额的 20% 查账征收。提前让中介在税务核税系统模拟测算，避免税局按差额核算导致意外巨额税金。",
      },
      {
        text: "落实上海「契税 140㎡ 最新新政标准」",
        detail: "首套购房：≤140㎡ 统一按 1% 征收，>140㎡ 按 1.5% 征收；二套改善：≤140㎡ 同样按 1% 征收，>140㎡ 按 2% 征收。计税基数为不含增值税的税务核定价。",
      },
      {
        text: "严禁「阴阳合同 / 低报网签价」税务稽查与首付拉高风险",
        detail: "上海各区各板块房产交易中心税务系统均有指导核税最低底线，过低网签价不仅会被税务系统驳回强制按评估价核税，而且会导致银行贷款额度被压缩，买家实际首付款大幅飙升。",
        warning: true,
      },
    ],
  },
  {
    title: "阶段三：看盘议价、中介费谈判与合同签署",
    badge: "谈判签约",
    items: [
      {
        text: "对比周边同小区真实历史成交底价（挤出虚高水分）",
        detail: "贝壳等平台挂牌价普遍存在 5%~15% 虚高空间。通过中介后台调取近3个月同户型同楼层真实成交价作为心理谈判底牌。",
      },
      {
        text: "签约前书面锁定中介服务费折扣比例与分期支付节点",
        detail: "目前上海为买方市场，签约前必须书面敲定中介费率（争取 1.0% ~ 1.3%），严禁口头承诺；约定支付节点为：网签付一半、过户付一半，交房完成无争议后结清。",
        warning: true,
      },
      {
        text: "强制采用上海官方二手房「交易资金监管」账户",
        detail: "定金与首付款务必存入上海官方交易资金监管平台（完全免费），严禁私下转入房东个人或中介个人账户，杜绝房东卷款跑路或房屋中途被法院查封风险。",
        warning: true,
      },
      {
        text: "定金条款明确「若因银行贷款审批不通过，无条件全额退还定金」",
        detail: "在认购意向书及买卖合同中务必补充此免责条款，防范因政策突变、房龄限制或银行流水审批未达预期导致定金被卖家没收。",
        warning: true,
      },
      {
        text: "签约当天当场拉取最新不动产登记簿产调证明",
        detail: "确认房屋无抵押（或明确垫资解抵押方案）、无司法查封、无设立居住权、产权人身份证件一致且所有共有人均到场或有合法公证委托。",
      },
    ],
  },
  {
    title: "阶段四：交房验房、物业交割与户口清算",
    badge: "交房过户",
    items: [
      {
        text: "截留 1 ~ 2 万元「交房与户口迁移尾款押金」",
        detail: "在过户支付购房款时，务必预留 1~2 万元尾款作为交房保证金，待原业主户口全部迁出、水电气物业清算完毕、家具家电及钥匙交接无误后再行支付。",
        warning: true,
      },
      {
        text: "补充协议中明确约定户口限期迁出时间与高额违约金",
        detail: "明确条款：“原产权人及户籍在册人员须于产证过户后 30 日内迁出全部户口；逾期未迁出，按日赔偿总房款万分之五违约金；逾期超过30天买家有权起诉强迁并索赔”。",
      },
      {
        text: "物业管理费与公共维修基金交割核验",
        detail: "索取房东上一期物业缴费收据，确认无陈年欠缴物业费；上海二手房公共维修基金随房自然过户给新业主，过户后去物业服务中心更新业主身份信息。",
      },
      {
        text: "水、电、燃气、宽带现场抄表结清并办理过户更名",
        detail: "陪同房东到公用事业网点或线上 App 结清账单（重点结清冬夏季阶梯电价与燃气费差额），将水电气卡号过户至买家名下。",
      },
      {
        text: "专业验房排查隐蔽工程（防水、电路、门窗与空鼓）",
        detail: "重点做卫生间与厨房闭水试验、查看天花板有无楼上渗水、检测电路回路地线接地、排查空鼓开裂及下水管道通畅情况。",
      },
    ],
  },
];

export const ChecklistSection: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => getStoredChecked());

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleResetChecklist = () => {
    if (window.confirm("确定要重置所有避坑排查进度吗？")) {
      setCheckedItems({});
      try { localStorage.removeItem(CHECKLIST_STORAGE_KEY); } catch {}
    }
  };

  // ── 🧮 上海二手房税费与全口径购房成本速算器 State ─────────────
  const [taxPriceWuan, setTaxPriceWuan] = useState<number>(500);
  const [taxAreaSqm, setTaxAreaSqm] = useState<number>(88);
  const [taxStatus, setTaxStatus] = useState<"five_only" | "two_only" | "two_non_only" | "under_two">("five_only");
  const [isFirstHome, setIsFirstHome] = useState<boolean>(true);
  const [agencyFeeRate, setAgencyFeeRate] = useState<number>(0.012); // 1.2%
  const [renovationBudgetWuan, setRenovationBudgetWuan] = useState<number>(5); // 5万

  // ── 🛡️ 风险折价试算器 State ─────────────────────────────
  const [calcPriceWuan, setCalcPriceWuan] = useState<number>(500);
  const [riskAge, setRiskAge] = useState<boolean>(false);
  const [riskLayoutNoise, setRiskLayoutNoise] = useState<boolean>(false);
  const [riskParking, setRiskParking] = useState<boolean>(false);
  const [riskMetro, setRiskMetro] = useState<boolean>(false);
  const [riskSchool, setRiskSchool] = useState<boolean>(false);

  // ── 税费精算计算 ──
  const priceYuan = taxPriceWuan * 10000;
  // 契税税率 (上海最新140㎡标准)
  let deedTaxRate = 0.01;
  if (isFirstHome) {
    deedTaxRate = taxAreaSqm <= 140 ? 0.01 : 0.015;
  } else {
    deedTaxRate = taxAreaSqm <= 140 ? 0.01 : 0.02;
  }

  // 增值税及附加 (不满2年全额征收约5.03%)
  const vatRate = taxStatus === "under_two" ? 0.053 : 0;
  const vatYuan = vatRate > 0 ? (priceYuan / 1.053) * 0.053 : 0;
  const taxableBase = priceYuan - vatYuan; // 不含增值税计税基数

  // 契税
  const deedTaxYuan = taxableBase * deedTaxRate;

  // 个人所得税 (满五唯一免征，否则核定1%)
  const pitRate = taxStatus === "five_only" ? 0 : 0.01;
  const pitYuan = taxableBase * pitRate;

  // 经纪中介费
  const agencyFeeYuan = priceYuan * agencyFeeRate;

  // 官方工本及抵押登记杂费
  const miscOfficialYuan = 160;

  // 额外税费总额 (万元)
  const totalTaxYuan = deedTaxYuan + vatYuan + pitYuan;
  const totalTaxWuan = Math.round((totalTaxYuan / 10000) * 100) / 100;

  // 综合杂费总支出 (税 + 中介费 + 规费 + 装修启动备用金)
  const allExtraCostWuan = Math.round(((totalTaxYuan + agencyFeeYuan + miscOfficialYuan) / 10000 + renovationBudgetWuan) * 100) / 100;
  const extraCostRatio = taxPriceWuan > 0 ? ((allExtraCostWuan / taxPriceWuan) * 100).toFixed(1) : "0.0";

  // ── 风险折价计算 ──
  let discountPct = 0;
  if (riskAge) discountPct += 10;
  if (riskLayoutNoise) discountPct += 8;
  if (riskParking) discountPct += 5;
  if (riskMetro) discountPct += 5;
  if (riskSchool) discountPct += 10;
  discountPct = Math.min(35, discountPct);

  const discountWuan = Math.round(((calcPriceWuan * discountPct) / 100) * 10) / 10;
  const safeTargetPriceWuan = Math.round((calcPriceWuan - discountWuan) * 10) / 10;

  // ── 进度统计 ──
  const totalItemsCount = checklistCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedItemsCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPct = totalItemsCount > 0 ? Math.round((checkedItemsCount / totalItemsCount) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
      {/* ── 顶部 Header 与进度条 ── */}
      <div
        className="glass-card mobile-p-14"
        style={{
          padding: "24px",
          background: "linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(248, 250, 252, 0.9) 100%)",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.4rem" }}>🛡️</span>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
              上海二手房交易税费与全流程避坑 Checklist
            </h2>
          </div>

          <button
            onClick={handleResetChecklist}
            style={{
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            🔄 重置排查进度
          </button>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "16px" }}>
          严格结合上海最新房地产交易税费政策（<strong>取消普宅标准、契税140㎡新政</strong>）与真实实战交易流程，涵盖资金筹备、产调税费核验、议价谈判到资金监管与交房清算的全套风控清单。
        </p>

        {/* 排查进度条 */}
        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.825rem", fontWeight: 700 }}>
            <span style={{ color: "var(--text-main)" }}>📋 全流程避坑排查进度</span>
            <span style={{ color: "var(--primary)" }}>{checkedItemsCount} / {totalItemsCount} 项 ({progressPct}%)</span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "linear-gradient(90deg, #059669 0%, #10b981 100%)",
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── 🧮 模块一：上海二手房全口径税费与额外支出速算器 ── */}
      <div
        className="glass-card mobile-p-14"
        style={{
          padding: "22px",
          border: "1px solid rgba(5, 150, 105, 0.3)",
          background: "linear-gradient(180deg, #ffffff 0%, rgba(240, 253, 244, 0.4) 100%)",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>💰</span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)", margin: 0 }}>
              上海二手房全口径购房税费与额外支出速算器
            </h3>
          </div>
          <span className="badge badge-success" style={{ fontSize: "0.725rem" }}>已适配契税 140㎡ & 取消普宅新政</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "18px" }}>
          {/* 输入控制面板 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", display: "block", marginBottom: "4px" }}>
                  房源成交总价 (万元)
                </label>
                <input
                  type="number"
                  step="10"
                  value={taxPriceWuan}
                  onChange={(e) => setTaxPriceWuan(parseFloat(e.target.value) || 0)}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", display: "block", marginBottom: "4px" }}>
                  产证建筑面积 (㎡)
                </label>
                <input
                  type="number"
                  step="1"
                  value={taxAreaSqm}
                  onChange={(e) => setTaxAreaSqm(parseFloat(e.target.value) || 0)}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* 房源满溢情况选择 */}
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                房源产权与税费性质 (影响个税与增值税)：
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {[
                  { id: "five_only", label: "满五唯一", tip: "免个税 + 免增值税 (最省)" },
                  { id: "two_only", label: "满二唯一", tip: "免增值税 + 个税1%" },
                  { id: "two_non_only", label: "满二不唯一", tip: "免增值税 + 个税1%" },
                  { id: "under_two", label: "不满二年", tip: "增值税5.3% + 个税1% (最贵)" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTaxStatus(opt.id as any)}
                    style={{
                      padding: "7px 8px",
                      borderRadius: "8px",
                      border: taxStatus === opt.id ? "1.5px solid var(--primary)" : "1px solid var(--border-color)",
                      background: taxStatus === opt.id ? "var(--primary-light)" : "#ffffff",
                      color: taxStatus === opt.id ? "var(--primary)" : "var(--text-main)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: "0.78rem", fontWeight: 700 }}>{opt.label}</div>
                    <div style={{ fontSize: "0.68rem", color: taxStatus === opt.id ? "var(--primary)" : "var(--text-muted)" }}>{opt.tip}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 买家首套/二套 + 中介费率 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", display: "block", marginBottom: "4px" }}>
                  买家家庭购房资质
                </label>
                <select
                  value={isFirstHome ? "first" : "second"}
                  onChange={(e) => setIsFirstHome(e.target.value === "first")}
                  style={{ width: "100%", padding: "7px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "#fff", fontSize: "0.8rem" }}
                >
                  <option value="first">首套住房 (契税1%~1.5%)</option>
                  <option value="second">二套改善 (契税1%~2%)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", display: "block", marginBottom: "4px" }}>
                  中介服务费率
                </label>
                <select
                  value={agencyFeeRate}
                  onChange={(e) => setAgencyFeeRate(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: "7px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "#fff", fontSize: "0.8rem" }}
                >
                  <option value={0.01}>1.0% (买方市场强力砍价)</option>
                  <option value={0.012}>1.2% (上海常规谈判水准)</option>
                  <option value={0.015}>1.5% (大中介标准折扣)</option>
                  <option value={0.02}>2.0% (官方标价/无折扣)</option>
                </select>
              </div>
            </div>

            {/* 装修翻新预估 */}
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", display: "block", marginBottom: "4px" }}>
                后期装修翻新 / 软装启动备用金 (万元)
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { label: "直接入住 (0万)", val: 0 },
                  { label: "精装微调 (3万)", val: 3 },
                  { label: "局部翻新 (8万)", val: 8 },
                  { label: "老房重装 (15万)", val: 15 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setRenovationBudgetWuan(item.val)}
                    style={{
                      flex: 1,
                      padding: "5px 4px",
                      borderRadius: "6px",
                      border: renovationBudgetWuan === item.val ? "1.5px solid var(--primary)" : "1px solid var(--border-color)",
                      background: renovationBudgetWuan === item.val ? "var(--primary-light)" : "#fff",
                      fontSize: "0.725rem",
                      fontWeight: renovationBudgetWuan === item.val ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 测算结果呈现卡片 */}
          <div
            style={{
              background: "#ffffff",
              padding: "18px",
              borderRadius: "12px",
              border: "1px solid rgba(5, 150, 105, 0.25)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.06)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.825rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "10px" }}>
                📊 交易税杂费与启动资金明细清单：
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>① 契税 ({(deedTaxRate * 100).toFixed(1)}%)：</span>
                  <strong style={{ color: "var(--text-main)" }}>{(deedTaxYuan / 10000).toFixed(2)} 万元</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>② 增值税及附加 ({vatRate > 0 ? "5.3%" : "免征 0%"})：</span>
                  <strong style={{ color: vatYuan > 0 ? "var(--danger)" : "var(--success)" }}>
                    {vatYuan > 0 ? `${(vatYuan / 10000).toFixed(2)} 万元` : "0.00 万元 (免征)"}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>③ 个人所得税 ({pitRate > 0 ? "1%" : "免征 0%"})：</span>
                  <strong style={{ color: pitYuan > 0 ? "var(--warning)" : "var(--success)" }}>
                    {pitYuan > 0 ? `${(pitYuan / 10000).toFixed(2)} 万元` : "0.00 万元 (免征)"}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border-color)", paddingTop: "5px", marginTop: "2px" }}>
                  <span style={{ color: "var(--primary)", fontWeight: 700 }}>📌 纯交易税费小计 (①+②+③)：</span>
                  <strong style={{ color: "var(--primary)" }}>{totalTaxWuan.toFixed(2)} 万元</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>④ 中介服务费 ({(agencyFeeRate * 100).toFixed(1)}%)：</span>
                  <strong style={{ color: "var(--text-main)" }}>{(agencyFeeYuan / 10000).toFixed(2)} 万元</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>⑤ 装修与软装启动备用金：</span>
                  <strong style={{ color: "var(--text-main)" }}>{renovationBudgetWuan.toFixed(2)} 万元</strong>
                </div>
              </div>
            </div>

            {/* 汇总高亮 */}
            <div style={{ borderTop: "2px solid var(--border-color)", paddingTop: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-main)" }}>额外税杂费总计：</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--danger)" }}>
                  {allExtraCostWuan} <span style={{ fontSize: "0.8rem" }}>万元 (约占总价 {extraCostRatio}%)</span>
                </span>
              </div>

              <div style={{ fontSize: "0.725rem", color: "var(--text-dim)", lineHeight: 1.4 }}>
                💡 <strong>全口径现金准备建议</strong>：除首付款（按 15%~30% 约 {Math.round(taxPriceWuan * 0.2)} 万）外，您手头必须额外预留 <strong>{allExtraCostWuan} 万元</strong> 现金，避免签约后因税费中介费导致资金链断裂。
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 🛡️ 模块二：房产风险折价因子试算器 ── */}
      <div
        className="glass-card mobile-p-14"
        style={{
          padding: "22px",
          border: "1px solid rgba(220, 38, 38, 0.25)",
          background: "linear-gradient(135deg, #ffffff 0%, rgba(254, 242, 242, 0.6) 100%)",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <ShieldCheckIcon color="var(--danger)" size={22} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--danger)", margin: 0 }}>
            房产瑕疵折价因子与实战砍价目标试算器
          </h3>
        </div>
        <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "14px" }}>
          输入意向房源挂牌价，勾选房屋存在的客观瑕疵硬伤，系统自动帮您测算应要求房东给予的砍价让利空间。
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "18px" }}>
          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-main)", display: "block", marginBottom: "4px" }}>
                房源挂牌总价 (万元)
              </label>
              <input
                type="number"
                value={calcPriceWuan}
                onChange={(e) => setCalcPriceWuan(parseFloat(e.target.value) || 0)}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--danger)", display: "block", marginBottom: "6px" }}>
                勾选房屋存在的瑕疵/风险项：
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "#fff", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <input type="checkbox" checked={riskAge} onChange={(e) => setRiskAge(e.target.checked)} style={{ accentColor: "var(--danger)" }} />
                  <span>🏢 房龄偏老 (&gt;20年老破小，商贷受限) <strong style={{ color: "var(--danger)" }}>-10%</strong></span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "#fff", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <input type="checkbox" checked={riskLayoutNoise} onChange={(e) => setRiskLayoutNoise(e.target.checked)} style={{ accentColor: "var(--danger)" }} />
                  <span>📐 顶底楼 / 临高架主干道噪音 / 暗卫手枪户型 <strong style={{ color: "var(--danger)" }}>-8%</strong></span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "#fff", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <input type="checkbox" checked={riskParking} onChange={(e) => setRiskParking(e.target.checked)} style={{ accentColor: "var(--danger)" }} />
                  <span>🚗 车位极度紧张 (配比&lt;0.6) / 物业混乱 <strong style={{ color: "var(--danger)" }}>-5%</strong></span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "#fff", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <input type="checkbox" checked={riskMetro} onChange={(e) => setRiskMetro(e.target.checked)} style={{ accentColor: "var(--danger)" }} />
                  <span>🚇 远郊非轨交盘 / 离地铁站 &gt; 1.5 公里 <strong style={{ color: "var(--danger)" }}>-5%</strong></span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "#fff", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <input type="checkbox" checked={riskSchool} onChange={(e) => setRiskSchool(e.target.checked)} style={{ accentColor: "var(--danger)" }} />
                  <span>🎓 学区超额预警 / 五年一户名额被占用 <strong style={{ color: "var(--danger)" }}>-10%</strong></span>
                </label>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div
            style={{
              background: "#ffffff",
              padding: "18px",
              borderRadius: "12px",
              border: "1px solid rgba(220, 38, 38, 0.25)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "12px",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.05)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.825rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>综合瑕疵折价比例：</span>
                <span style={{ fontWeight: 800, color: "var(--danger)", fontSize: "1.1rem" }}>-{discountPct}%</span>
              </div>

              <div style={{ fontSize: "0.825rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>建议首轮砍价空间：</span>
                <span style={{ fontWeight: 800, color: "var(--warning)", fontSize: "1.1rem" }}>{discountWuan} 万元</span>
              </div>
            </div>

            <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "10px" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>理性安全入手目标建议价：</div>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--danger)" }}>
                {safeTargetPriceWuan} <span style={{ fontSize: "0.85rem" }}>万元</span>
              </div>
              <div style={{ fontSize: "0.725rem", color: "var(--text-dim)", marginTop: "4px" }}>
                高于 {safeTargetPriceWuan} 万可能面临瑕疵溢价风险，谈判时建议坚守此心理底价。
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 📋 模块三：全流程四大阶段风控 Checklist ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {checklistCategories.map((cat, catIdx) => (
          <div
            key={catIdx}
            className="glass-card mobile-p-14"
            style={{
              padding: "22px",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "var(--text-main)",
                  margin: 0,
                }}
              >
                {cat.title}
              </h3>
              <span className="badge badge-primary" style={{ fontSize: "0.725rem" }}>{cat.badge}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      background: isChecked
                        ? "rgba(16, 185, 129, 0.06)"
                        : "#ffffff",
                      border: isChecked
                        ? "1.5px solid var(--success)"
                        : "1px solid var(--border-color)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "5px",
                        border: isChecked
                          ? "none"
                          : "2px solid #cbd5e1",
                        background: isChecked
                          ? "var(--success)"
                          : "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "2px",
                        flexShrink: 0,
                      }}
                    >
                      {isChecked && (
                        <CheckCircleIcon size={14} color="#ffffff" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          color: isChecked
                            ? "var(--success)"
                            : "var(--text-main)",
                          textDecoration: isChecked ? "line-through" : "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>{item.text}</span>
                        {item.warning && !isChecked && (
                          <span className="badge badge-danger" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>重点避坑</span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "0.775rem",
                          color: "var(--text-muted)",
                          marginTop: "4px",
                          lineHeight: 1.5,
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
