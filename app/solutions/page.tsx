import type { Metadata } from "next";
import Image from "next/image";
import styles from "./solutions.module.css";

export const metadata: Metadata = {
  title: "WuFlow Tech 悟流技术｜嵌入式软硬件定制开发",
  description: "独立工程师主导的技术研发服务工作室。约12年嵌入式研发经验，提供控制器、MCU固件、PCB及工业通信开发服务，探索企业本地AI与工业智能化方案。",
  openGraph: {
    title: "WuFlow Tech 悟流技术｜务实的工程研发服务",
    description: "专注嵌入式软硬件开发，让产品研发与技术升级更高效。面向制造企业、工业设备公司与智能硬件团队。",
    locale: "zh_CN",
    type: "website",
  },
};

// 正式联系方式统一在此配置；留空时不生成联系按钮。
const CONTACT = {
  email: "liwentao910603@gmail.com",
  wechatQr: "/solutions/wechat-consultation-qr.jpg",
};
const navigation = [
  ["home", "首页"], ["services", "技术服务"], ["capabilities", "技术能力"],
  ["process", "合作流程"], ["contact", "联系合作"],
];
const embedded = [
  "工业设备控制器与定制控制系统",
  "灯具控制器与智能照明系统",
  "MCU固件、电路设计与软硬件协同开发",
  "现有产品功能升级、故障排查与技术维护",
  "原型验证、样机调试与小批量样机支持",
];
const platforms = ["STM32（F0 / F1 / F4 / G0 / G4 / H7 等）", "GD32", "ESP32 / ESP8266", "NXP / LPC", "AVR", "PIC", "Nordic nRF 系列"];
const technicalGroups = [
  { title: "固件与控制逻辑", items: ["MCU固件与底层驱动开发", "Bootloader / 升级机制设计", "状态机与控制逻辑设计", "低功耗设计、参数存储与故障诊断"] },
  { title: "硬件设计与联调", items: ["原理图与PCB设计", "电源电路、接口保护与传感器接口", "继电器 / MOS驱动电路", "样机调试、软硬件联调与EMC / 抗干扰优化"] },
  { title: "通信协议与接口", items: ["UART / RS232 / RS485 / CAN", "I2C / SPI", "Modbus RTU / Modbus TCP", "Ethernet及工业设备协议对接"] },
];
const extensions = [
  { number: "02", title: "企业本地AI部署", status: "新业务方向 · 技术验证中", description: "探索面向企业内部知识管理与业务辅助场景的本地AI方案，开展开源模型、私有知识库及系统集成的技术评估与验证。", items: ["开源模型部署方案评估", "企业知识库及RAG技术验证", "企业内网AI应用方案", "AI服务器硬件选型建议", "业务系统集成可行性分析"] },
  { number: "03", title: "AI边缘设备与工业智能化", status: "新业务方向 · 接受方案咨询", description: "基于嵌入式控制技术积累，探索工业设备数据采集、边缘计算及传统控制系统智能化升级。", items: ["工业设备数据采集", "边缘计算技术方案", "MCU与AI计算模块协同", "工业协议对接", "设备状态监测原型设计"] },
];
const problems = ["现有控制器需要功能升级或重新设计。", "嵌入式软硬件存在通信故障或稳定性问题。", "企业缺少人员完成PCB、固件或工业控制系统开发。", "希望探索本地AI或设备智能化，但不清楚技术路径。"];
const steps = [
  ["需求沟通", "交流项目背景、现有问题与预期目标。"],
  ["技术评估", "梳理技术路径、实施边界与关键风险。"],
  ["方案报价与实施", "明确工作范围、交付内容和计划后推进开发。"],
  ["测试交付", "按约定验证功能，完成成果与技术资料交接。"],
];

function Brand() {
  return <span className={styles.brand}><span className={styles.brandMark} aria-hidden="true">W<span>·</span></span><span>WuFlow <b>Tech</b><small>悟流技术</small></span></span>;
}

function CircuitIllustration() {
  return <div className={styles.diagram}>
    <div className={styles.diagramLabel}><span className={styles.statusDot} /> EMBEDDED SYSTEMS <span>01 / ENGINEERING</span></div>
    <svg viewBox="0 0 520 350" role="img" aria-labelledby="circuit-title">
      <title id="circuit-title">工业控制器与PCB电路的抽象工程示意图，非实际产品</title>
      <defs>
        <pattern id="circuit-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#21324d" strokeWidth="0.5" /></pattern>
        <linearGradient id="board-fill" x2="1" y2="1"><stop stopColor="#172b49" /><stop offset="1" stopColor="#0d1a2e" /></linearGradient>
      </defs>
      <rect width="520" height="350" fill="url(#circuit-grid)" />
      <g transform="translate(60 35)">
        <rect x="0" y="0" width="400" height="270" rx="16" fill="url(#board-fill)" stroke="#3c5b81" />
        {[ [16,16], [384,16], [16,254], [384,254] ].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="#0b1220" stroke="#60738a" />)}
        <g fill="none" stroke="#3977bb" strokeWidth="2">
          <path d="M0 75H80L125 120H155 M0 95H65L110 140H155 M0 205H75L135 165H155 M245 110H290L320 65H400 M245 130H315L345 95H400 M245 150H300L330 200H400 M185 90V50H110V0 M215 90V30H290V0 M185 180V220H125V270 M215 180V235H280V270" />
        </g>
        <g stroke="#9ab7d8" strokeWidth="4">
          {[105,120,135,150,165].map(y => <path key={y} d={`M144 ${y}h14 M243 ${y}h14`} />)}
          {[170,185,200,215,230].map(x => <path key={x} d={`M${x} 80v14 M${x} 178v14`} />)}
        </g>
        <rect x="155" y="90" width="90" height="90" rx="6" fill="#101827" stroke="#6a95cc" />
        <text x="200" y="131" textAnchor="middle" fill="#fff" fontSize="19" fontFamily="monospace">MCU</text>
        <text x="200" y="151" textAnchor="middle" fill="#809abd" fontSize="9" fontFamily="monospace">CONTROL CORE</text>
        {[45,65,85].map(y => <rect key={y} x="365" y={y} width="45" height="12" rx="2" fill="#56818a" stroke="#a2c5c7" />)}
        {[65,85,105].map(y => <rect key={y} x="-10" y={y} width="42" height="12" rx="2" fill="#34475f" stroke="#8c9fb5" />)}
        <rect x="45" y="155" width="40" height="20" rx="3" fill="#a5b3c4" /><path d="M50 165h30" stroke="#50657f" />
        <circle cx="335" cy="220" r="17" fill="#182339" stroke="#68819f" /><circle cx="335" cy="220" r="10" fill="#334c68" />
        <circle cx="55" cy="225" r="4" fill="#57ddbd" /><text x="69" y="229" fill="#82a6b1" fontSize="9" fontFamily="monospace">SYSTEM READY</text>
      </g>
    </svg>
    <div className={styles.diagramTags}><span>MCU / FIRMWARE</span><span>PCB DESIGN</span><span>INDUSTRIAL I/O</span></div>
    <p className={styles.diagramCaption}>从电路到固件，连接每一个工程细节 <span>概念示意 · 非产品实拍</span></p>
  </div>;
}

export default function SolutionsPage() {
  const hasContact = Boolean(CONTACT.email.trim() || CONTACT.wechatQr);
  return <div className={styles.page} lang="zh-CN">
    <a className={styles.skipLink} href="#main-content">跳转到主要内容</a>
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <a href="#home" aria-label="WuFlow Tech 悟流技术首页" className={styles.brandLink}><Brand /></a>
        <nav aria-label="主导航" className={styles.navigation}>{navigation.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>
      </div>
    </header>
    <main id="main-content">
      <section id="home" className={styles.hero} aria-labelledby="hero-title">
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div>
            <p className={styles.eyebrow}><span /> INDEPENDENT ENGINEERING STUDIO</p>
            <p className={styles.heroIntro}>独立工程师主导的技术研发服务工作室</p>
            <h1 id="hero-title">专注嵌入式软硬件开发，<br /><span>让产品研发与技术升级更高效</span></h1>
            <p className={styles.heroDescription}>约12年嵌入式软硬件研发经验，面向制造企业和智能设备团队，提供控制器设计、MCU固件开发、PCB设计、工业通信及现有产品升级服务，同时探索企业本地AI与工业智能化方案。</p>
            <div className={styles.actions}><a href="#contact" className={styles.primaryButton}>咨询技术合作 <span aria-hidden="true">↗</span></a><a href="#services" className={styles.secondaryButton}>了解技术服务 <span aria-hidden="true">↓</span></a></div>
          </div>
          <CircuitIllustration />
        </div>
        <div className={`${styles.container} ${styles.heroBottom}`}><span>面向制造企业 · 工业设备公司 · 智能硬件团队</span><span>硬件设计 <i>/</i> 固件开发 <i>/</i> 系统联调</span></div>
      </section>

      <section id="services" className={styles.section} aria-labelledby="services-title">
        <div className={styles.container}>
          <div className={styles.sectionHeading}><div><p className={styles.kicker}>01 / TECHNICAL SERVICES</p><h2 id="services-title">立足嵌入式，探索智能化</h2></div><p>以实际研发需求为起点，<br />明确技术边界，推进可落地的方案。</p></div>
          <article className={styles.coreCard}>
            <div><span className={styles.badge}>核心业务</span><p className={styles.cardNumber}>01 / EMBEDDED DEVELOPMENT</p><h3>嵌入式软硬件定制开发</h3><p>面向工业设备和智能硬件研发需求，提供从功能分析、电路设计、固件开发到软硬件联调的定制技术服务。</p><a className={styles.textLink} href="#contact">交流你的研发需求 <span aria-hidden="true">↗</span></a></div>
            <div>
              <h4 className={styles.subheading}>主要方向</h4>
              <ul className={styles.coreList}>{embedded.map(item => <li key={item}><span aria-hidden="true">↗</span>{item}</li>)}</ul>
            </div>
            <div className={styles.technicalSupport}>
              <h4 className={styles.subheading}>可支持技术</h4>
              <div className={styles.platformRow}>
                <h5>MCU / 平台选型</h5>
                <ul className={styles.platformTags}>{platforms.map(platform => <li key={platform}>{platform}</li>)}</ul>
                <p className={styles.scopeNote}>根据功能、成本、功耗和现有软硬件基础评估平台适配；其他常见MCU平台也可沟通评估。</p>
              </div>
              <div className={styles.technicalGrid}>
                {technicalGroups.map(group => <div key={group.title}>
                  <h5>{group.title}</h5>
                  <ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul>
                </div>)}
              </div>
              <p className={styles.scopeNote}>具体平台、开发深度与交付范围以技术评估为准；EMC / 抗干扰优化不等同于认证承诺。</p>
            </div>
          </article>
          <div className={styles.extensionGrid}>{extensions.map(service => <article className={styles.extensionCard} key={service.number}>
            <div className={styles.cardTop}><span className={styles.cardNumber}>{service.number} / EXPLORATION</span><span className={styles.outlineBadge}>{service.status}</span></div><h3>{service.title}</h3><p>{service.description}</p><ul>{service.items.map(item => <li key={item}>{item}</li>)}</ul>
          </article>)}</div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.softSection}`} aria-labelledby="problems-title"><div className={styles.container}>
        <p className={styles.kicker}>REAL NEEDS / PRACTICAL SUPPORT</p><h2 id="problems-title">针对实际研发问题，<br />提供务实的技术支持</h2>
        <div className={styles.problemGrid}>{problems.map((problem, index) => <article className={styles.problem} key={problem}><span>0{index + 1}</span><h3>{problem}</h3></article>)}</div>
      </div></section>

      <section id="capabilities" className={styles.section} aria-labelledby="capabilities-title"><div className={`${styles.container} ${styles.capabilitiesGrid}`}>
        <div><p className={styles.kicker}>02 / ENGINEERING CAPABILITIES</p><h2 id="capabilities-title">多年工程研发积累，<br />重视技术可行性与交付质量</h2><p className={styles.sectionDescription}>从需求理解到软硬件调试，以工程实践为基础，关注功能实现、通信稳定性与后续维护。</p><div className={styles.experience}><span>约<strong>12</strong>年</span><p>嵌入式研发经验<br /><small>持续积累，务实交付</small></p></div></div>
        <div><ul className={styles.capabilityList}>{["MCU固件与控制器开发", "PCB设计和软硬件调试", "工业通信协议集成", "智能照明及控制系统经验"].map((item, index) => <li key={item}><span>0{index + 1}</span>{item}<span aria-hidden="true">↗</span></li>)}</ul><aside className={styles.explorationNote}><strong>正在拓展的技术方向</strong><p>企业本地AI、知识库RAG与边缘智能目前处于探索和技术验证阶段，具体服务范围以项目评估为准。</p></aside></div>
      </div></section>

      <section id="process" className={`${styles.section} ${styles.softSection}`} aria-labelledby="process-title"><div className={styles.container}>
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>03 / HOW WE WORK</p><h2 id="process-title">清晰沟通，稳步推进</h2></div><p>从初步交流到测试交付，<br />每一步都有明确的目标。</p></div>
        <ol className={styles.processGrid}>{steps.map(([title, description], index) => <li key={title}><div className={styles.stepNumber}>0{index + 1}<span aria-hidden="true">{index < 3 ? "→" : "✓"}</span></div><h3>{title}</h3><p>{description}</p></li>)}</ol>
      </div></section>

      <section id="contact" className={styles.contact} aria-labelledby="contact-title"><div className={`${styles.container} ${styles.contactGrid}`}>
        <div><p className={styles.eyebrow}>LET’S BUILD SOMETHING THAT WORKS</p><h2 id="contact-title">有技术研发需求？<br />欢迎沟通。</h2><p>无论是现有控制器升级、嵌入式软硬件开发，还是工业设备智能化方案，都欢迎提供项目背景与技术需求，进行初步交流。</p></div>
        <div className={styles.contactPanel}>
          <span className={styles.contactLabel}>联系合作 / CONTACT</span>
          {hasContact ? <div className={styles.contactMethods}>
            {CONTACT.email.trim() && <div className={styles.emailContact}>
              <h3>邮件咨询</h3>
              <p>{CONTACT.email}</p>
              <a className={styles.primaryButton} href={`mailto:${CONTACT.email}`}>发送邮件 <span aria-hidden="true">↗</span></a>
            </div>}
            {CONTACT.wechatQr && <div className={styles.wechatContact}>
              <div><h3>微信咨询</h3><p>扫码添加微信，沟通项目需求</p></div>
              <div className={styles.qrFrame}>
                <Image src={CONTACT.wechatQr} alt="微信咨询二维码：扫码添加微信，沟通项目需求" width={979} height={1007} unoptimized className={styles.qrImage} />
              </div>
            </div>}
          </div> : <><h3>正式联系方式待配置</h3><p>邮箱及微信将在确认后公布。当前页面暂不提供在线提交，请待联系方式更新后联系。</p></>}
          <div className={styles.contactHint}>沟通前可准备：项目背景、功能需求、现有资料与预期时间。</div>
        </div>
      </div></section>
    </main>
    <footer className={styles.footer}><div className={styles.container}><div className={styles.footerTop}><div><Brand /><p>独立工程师主导的技术研发服务工作室</p></div><nav aria-label="页脚导航">{navigation.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} WuFlow Tech 悟流技术</span><span>嵌入式软硬件 · 企业本地AI探索 · 工业智能化</span></div></div></footer>
  </div>;
}
