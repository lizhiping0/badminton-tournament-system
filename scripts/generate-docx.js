const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle, 
        WidthType, ShadingType, PageNumber, PageBreak, TableOfContents } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

const createHeading1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, bold: true })]
});

const createHeading2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, bold: true })]
});

const createHeading3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, bold: true })]
});

const createParagraph = (text) => new Paragraph({
  children: [new TextRun(text)]
});

const createBoldParagraph = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true })]
});

const createDataTable = (headers, rows) => {
  const colWidth = Math.floor(9360 / headers.length);
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: headers.map(() => colWidth),
    rows: [
      new TableRow({
        children: headers.map(h => new TableCell({
          borders,
          width: { size: colWidth, type: WidthType.DXA },
          shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ 
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: h, bold: true })] 
          })]
        }))
      }),
      ...rows.map(row => new TableRow({
        children: row.map(cell => new TableCell({
          borders,
          width: { size: colWidth, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun(cell)] })]
        }))
      }))
    ]
  });
};

const createFlowChart = (title, steps) => {
  const elements = [
    createBoldParagraph(title),
    new Paragraph({ children: [] })
  ];
  
  steps.forEach((step, index) => {
    elements.push(new Paragraph({
      numbering: { reference: "numbers", level: 0 },
      children: [new TextRun(step)]
    }));
  });
  
  elements.push(new Paragraph({ children: [] }));
  return elements;
};

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Microsoft YaHei", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Microsoft YaHei" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Microsoft YaHei" },
        paragraph: { spacing: { before: 280, after: 180 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Microsoft YaHei" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers2",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers3",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers4",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers5",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers6",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({ 
        children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "羽毛球团体赛管理系统需求规格说明书", size: 20 })] 
        })] 
      })
    },
    footers: {
      default: new Footer({ 
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun("第 "), new TextRun({ children: [PageNumber.CURRENT] }), new TextRun(" 页")]
        })] 
      })
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ text: "羽毛球团体赛管理系统", size: 48, bold: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ text: "需求规格说明书", size: 44, bold: true })]
      }),
      new Paragraph({ children: [] }),
      new Paragraph({ children: [] }),
      new Paragraph({ children: [new PageBreak()] }),

      createHeading1("1. 项目概述"),
      
      createHeading2("1.1 项目背景"),
      createParagraph("为满足中国信通院工物所羽毛球团体赛事管理需求，设计开发一套功能完善、操作便捷的羽毛球团体赛管理系统，实现比赛信息管理、赛制规则执行、数据收集与分析等功能，提升赛事管理效率和数据统计准确性。"),

      createHeading2("1.2 系统目标"),
      createParagraph("开发一套用户友好、功能全面、页面极简风格的羽毛球团体赛管理系统，支持赛事全流程管理，包括队伍管理、赛程安排、比分记录、成绩统计和数据查询等功能，确保赛事数据的完整性、准确性和可追溯性。"),
      createParagraph("但操作不能太复杂，简单够用就好。"),

      createHeading2("1.3 技术架构"),
      createHeading3("1.3.1 数据存储"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("采用本地存储方式，数据保存在本地数据库或文件中")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持数据备份和恢复功能，防止数据丢失")] }),
      
      createHeading3("1.3.2 访问方式"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("采用响应式网页设计，支持PC端和移动端访问")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("无需用户登录认证，系统内部使用")] }),
      
      createHeading3("1.3.3 多届比赛支持"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持管理多届比赛，可创建、切换和归档不同届次的赛事")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("各届比赛数据相互独立，可进行历史数据查询和对比")] }),

      createHeading1("2. 功能需求"),

      createHeading2("2.1 比赛信息管理模块"),
      createHeading3("2.1.1 比赛项目管理"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("系统需支持五种标准比赛项目：男子双打、女子双打、混合双打、男子单打、女子单打")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持对比赛项目的增删改查操作，可根据实际需求调整比赛项目设置")] }),

      createHeading3("2.1.2 参赛队伍管理"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持参赛队伍信息的添加、修改、删除和查询功能")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("记录各参赛队伍名称、联系人、联系电话等基本信息")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持为每个队伍维护详细的参赛人员姓名信息")] }),

      createHeading3("2.1.3 赛事管理"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持创建新的赛事届次")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持切换当前管理的赛事")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持查看历史赛事数据")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持赛事归档功能")] }),

      createHeading2("2.2 赛制规则实现"),
      createHeading3("2.2.1 比赛胜负判定"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("采用三局两胜制判定每场比赛的胜负结果")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("每局比赛设定为21分制")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("当比分达到20-20平时，比赛继续进行，直至某一方领先2分（最高分为30分）")] }),

      createHeading3("2.2.2 积分规则"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("每场比赛的胜者为所属团队贡献1个积分")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("团队积分累计计算，作为最终排名依据")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("积分相同情况下，依次比较：胜负关系 → 净胜局数 → 净胜分数")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("若仍相同，可进行附加赛或抽签决定")] }),

      createHeading3("2.2.3 团体赛对阵规则"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("采用淘汰赛制进行团体赛")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("每场团体赛包含5场单项比赛，出场顺序如下：")] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("男子双打")] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("女子单打")] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("男子单打")] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("女子双打")] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("混合双打")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("团体赛胜负判定：先赢得3场单项比赛的队伍获胜")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("淘汰赛对阵安排：根据参赛队伍数量自动生成对阵表，支持轮空处理")] }),

      createHeading2("2.3 数据收集功能"),
      createHeading3("2.3.1 比赛数据记录"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("实时记录每场比赛的详细比分，包括每局具体得分情况")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("记录比赛结果（胜负情况）")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持比分录入错误的修正功能，记录修正历史")] }),

      createHeading3("2.3.2 人员信息记录"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("记录所有参赛人员的姓名")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("记录每场比赛的裁判姓名信息")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("建立参赛人员与所属队伍的关联关系，确保人员归属清晰")] }),

      createHeading2("2.4 系统功能模块详细设计"),
      createHeading3("2.4.1 参赛队伍管理模块"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("功能：支持参赛队伍的增加、删除、修改和查询操作")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("界面：提供直观的队伍列表展示，支持分页和搜索功能")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("数据项：队伍ID、队伍名称、联系人、联系电话")] }),

      createHeading3("2.4.2 赛程安排模块"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("功能：支持比赛项目设置、对阵安排、比赛时间和场地分配")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持手动安排和自动安排两种模式")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("自动生成淘汰赛对阵表，支持轮空队伍处理")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("可生成赛程表并支持打印和导出功能")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持赛程变更和调整，并记录变更历史")] }),

      createHeading3("2.4.3 比分记录模块"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("功能：实时录入和更新比赛比分数据")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("界面：提供直观的比分录入界面，支持每局比分实时更新")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持比赛暂停、继续和结束等状态管理")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("自动根据比分判定每局胜负和整场比赛结果")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持比分录入错误的修正功能，需记录修正原因和时间")] }),

      createHeading3("2.4.4 成绩统计模块"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("功能：自动计算各团队积分及排名")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持按积分、净胜局数、净胜分数等多种方式进行排名")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("生成团队排名表、个人成绩统计表等")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持数据导出功能，可导出为Excel格式")] }),

      createHeading3("2.4.5 数据查询模块"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("功能：支持按比赛项目、团队、人员等多维度查询比赛数据")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("提供高级搜索功能，支持组合条件查询")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("查询结果支持排序、筛选和导出")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持历史数据查询和统计分析")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持跨届次数据对比分析")] }),

      createHeading2("2.5 数据存储要求"),
      createHeading3("2.5.1 数据存储内容"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("存储所有比赛的完整记录，包括比赛ID、比赛项目、参赛队伍、参赛人员、各局比分、胜负结果、比赛时间、场地信息等")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("存储各团队的基本信息及累计积分、排名信息")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("存储所有参赛人员的基本信息及参赛记录")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("存储裁判信息及执裁记录")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("存储比分修正历史记录")] }),

      createHeading3("2.5.2 数据完整性与安全性"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("确保数据的完整性，建立数据之间的关联关系")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("实现数据备份和恢复功能，防止数据丢失")] }),

      createHeading1("3. 非功能需求"),

      createHeading2("3.1 用户界面要求"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("系统界面设计应简洁直观，操作便捷")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("采用响应式设计，支持PC端和移动端访问")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("界面风格统一，符合现代UI设计标准")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("提供清晰的导航和操作指引")] }),

      createHeading2("3.2 性能要求"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("系统响应时间应在2秒以内")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持至少10支参赛队伍同时管理")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持至少100场比赛数据的并发处理")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("数据查询响应时间不超过3秒")] }),

      createHeading2("3.3 可靠性要求"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("系统平均无故障运行时间（MTBF）不低于1000小时")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("数据存储可靠性达到99.99%")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("具备完善的错误处理机制和日志记录功能")] }),

      createHeading2("3.4 可扩展性要求"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("系统设计应考虑未来功能扩展需求")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持增加新的比赛项目和赛制规则")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持与其他系统的数据接口对接")] }),

      createHeading2("3.5 部署要求"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("支持手机上操作（响应式网页）")] }),

      new Paragraph({ children: [new PageBreak()] }),
      createHeading1("4. 系统交互流程"),

      createHeading2("4.1 赛事创建流程"),
      ...createFlowChart("", [
        "管理员创建新赛事，填写赛事名称、时间等基本信息",
        "系统生成新的赛事届次，自动切换为当前赛事",
        "管理员设置比赛项目（默认为5项标准项目）",
        "系统进入队伍管理阶段"
      ]),

      createHeading2("4.2 队伍注册流程"),
      ...createFlowChart("", [
        "管理员添加参赛队伍，填写队伍名称、联系人等信息",
        "为每个队伍添加参赛人员信息",
        "系统验证信息完整性",
        "队伍信息保存成功，可继续添加或进入下一阶段"
      ]),

      createHeading2("4.3 赛程安排流程"),
      ...createFlowChart("", [
        "管理员选择赛程安排方式（自动/手动）",
        "自动模式：系统根据队伍数量生成淘汰赛对阵表",
        "手动模式：管理员手动设置对阵关系",
        "设置比赛时间和场地",
        "生成赛程表，支持打印和导出",
        "赛程确认后进入比赛阶段"
      ]),

      createHeading2("4.4 比赛记录流程"),
      ...createFlowChart("", [
        "选择当前进行的比赛场次",
        "录入参赛选手信息（从队伍成员中选择）",
        "录入裁判信息",
        "开始比赛，实时录入每局比分",
        "系统自动判定每局胜负",
        "比赛结束后系统自动计算团体赛结果",
        "更新团队积分和排名"
      ]),

      createHeading2("4.5 成绩统计流程"),
      ...createFlowChart("", [
        "系统自动汇总所有比赛结果",
        "计算各团队积分和排名",
        "生成团队排名表",
        "生成个人成绩统计表",
        "支持导出Excel格式报表"
      ]),

      createHeading2("4.6 比分修正流程"),
      ...createFlowChart("", [
        "选择需要修正的比赛记录",
        "点击【修正比分】按钮",
        "输入修正后的比分",
        "填写修正原因",
        "系统记录修正历史（原比分、新比分、修正时间、修正原因）",
        "更新比赛结果和相关统计数据"
      ]),

      createHeading2("4.7 系统交互流程图"),
      new Paragraph({ children: [] }),
      createParagraph("以下是系统主要交互流程的示意图："),
      new Paragraph({ children: [] }),
      
      createDataTable(["阶段", "操作", "输出结果"], [
        ["赛事创建", "填写赛事信息", "生成新赛事届次"],
        ["队伍注册", "添加队伍和人员", "队伍信息入库"],
        ["赛程安排", "自动/手动安排", "淘汰赛对阵表"],
        ["比赛进行", "录入比分", "实时更新成绩"],
        ["成绩统计", "自动计算", "排名表、统计表"],
      ]),

      new Paragraph({ children: [] }),
      createBoldParagraph("流程关系图："),
      new Paragraph({ children: [] }),
      createParagraph("赛事创建 → 队伍注册 → 赛程安排 → 比赛进行 → 成绩统计"),
      new Paragraph({ children: [] }),
      createParagraph("（比分修正可在比赛进行后任意时间执行）"),

      new Paragraph({ children: [new PageBreak()] }),
      createHeading1("5. 系统原型设计"),
      createParagraph("（此处应包含主要功能模块的界面原型设计说明）"),

      new Paragraph({ children: [new PageBreak()] }),
      createHeading1("6. 数据字典"),

      createHeading2("6.1 赛事实体"),
      createDataTable(["字段名", "字段类型", "说明"], [
        ["event_id", "整数", "赛事ID，主键"],
        ["event_name", "字符串", "赛事名称"],
        ["event_year", "整数", "赛事年份"],
        ["start_date", "日期", "开始日期"],
        ["end_date", "日期", "结束日期"],
        ["status", "枚举", "状态：筹备中/进行中/已结束/已归档"],
        ["create_time", "时间戳", "创建时间"],
      ]),

      new Paragraph({ children: [] }),
      createHeading2("6.2 队伍实体"),
      createDataTable(["字段名", "字段类型", "说明"], [
        ["team_id", "整数", "队伍ID，主键"],
        ["event_id", "整数", "所属赛事ID，外键"],
        ["team_name", "字符串", "队伍名称"],
        ["contact_person", "字符串", "联系人"],
        ["contact_phone", "字符串", "联系电话"],
        ["create_time", "时间戳", "创建时间"],
      ]),

      new Paragraph({ children: [] }),
      createHeading2("6.3 参赛人员实体"),
      createDataTable(["字段名", "字段类型", "说明"], [
        ["player_id", "整数", "人员ID，主键"],
        ["team_id", "整数", "所属队伍ID，外键"],
        ["player_name", "字符串", "姓名"],
        ["gender", "枚举", "性别：男/女"],
        ["create_time", "时间戳", "创建时间"],
      ]),

      new Paragraph({ children: [] }),
      createHeading2("6.4 比赛项目实体"),
      createDataTable(["字段名", "字段类型", "说明"], [
        ["match_type_id", "整数", "项目ID，主键"],
        ["type_name", "字符串", "项目名称（男双/女双/混双/男单/女单）"],
        ["sort_order", "整数", "出场顺序"],
        ["is_active", "布尔", "是否启用"],
      ]),

      new Paragraph({ children: [] }),
      createHeading2("6.5 团体赛实体"),
      createDataTable(["字段名", "字段类型", "说明"], [
        ["team_match_id", "整数", "团体赛ID，主键"],
        ["event_id", "整数", "所属赛事ID，外键"],
        ["round_number", "整数", "轮次（1=第一轮，2=第二轮...）"],
        ["team_a_id", "整数", "队伍A的ID，外键"],
        ["team_b_id", "整数", "队伍B的ID，外键"],
        ["match_time", "时间", "比赛时间"],
        ["venue", "字符串", "场地"],
        ["winner_team_id", "整数", "获胜队伍ID"],
        ["status", "枚举", "状态：未开始/进行中/已结束"],
      ]),

      new Paragraph({ children: [] }),
      createHeading2("6.6 单项比赛实体"),
      createDataTable(["字段名", "字段类型", "说明"], [
        ["match_id", "整数", "比赛ID，主键"],
        ["team_match_id", "整数", "所属团体赛ID，外键"],
        ["match_type_id", "整数", "比赛项目ID，外键"],
        ["team_a_player1_id", "整数", "队伍A选手1 ID"],
        ["team_a_player2_id", "整数", "队伍A选手2 ID（双打时使用）"],
        ["team_b_player1_id", "整数", "队伍B选手1 ID"],
        ["team_b_player2_id", "整数", "队伍B选手2 ID（双打时使用）"],
        ["referee_name", "字符串", "裁判姓名"],
        ["game1_score_a", "整数", "第一局队伍A得分"],
        ["game1_score_b", "整数", "第一局队伍B得分"],
        ["game2_score_a", "整数", "第二局队伍A得分"],
        ["game2_score_b", "整数", "第二局队伍B得分"],
        ["game3_score_a", "整数", "第三局队伍A得分（如需要）"],
        ["game3_score_b", "整数", "第三局队伍B得分（如需要）"],
        ["winner_team_id", "整数", "获胜队伍ID"],
        ["status", "枚举", "状态：未开始/进行中/已结束"],
        ["create_time", "时间戳", "创建时间"],
        ["update_time", "时间戳", "更新时间"],
      ]),

      new Paragraph({ children: [] }),
      createHeading2("6.7 比分修正记录实体"),
      createDataTable(["字段名", "字段类型", "说明"], [
        ["correction_id", "整数", "修正记录ID，主键"],
        ["match_id", "整数", "关联的比赛ID，外键"],
        ["original_game1_score_a", "整数", "原第一局队伍A得分"],
        ["original_game1_score_b", "整数", "原第一局队伍B得分"],
        ["original_game2_score_a", "整数", "原第二局队伍A得分"],
        ["original_game2_score_b", "整数", "原第二局队伍B得分"],
        ["original_game3_score_a", "整数", "原第三局队伍A得分"],
        ["original_game3_score_b", "整数", "原第三局队伍B得分"],
        ["new_game1_score_a", "整数", "新第一局队伍A得分"],
        ["new_game1_score_b", "整数", "新第一局队伍B得分"],
        ["new_game2_score_a", "整数", "新第二局队伍A得分"],
        ["new_game2_score_b", "整数", "新第二局队伍B得分"],
        ["new_game3_score_a", "整数", "新第三局队伍A得分"],
        ["new_game3_score_b", "整数", "新第三局队伍B得分"],
        ["correction_reason", "字符串", "修正原因"],
        ["correction_time", "时间戳", "修正时间"],
      ]),

      new Paragraph({ children: [] }),
      createHeading2("6.8 团队积分实体"),
      createDataTable(["字段名", "字段类型", "说明"], [
        ["standing_id", "整数", "记录ID，主键"],
        ["event_id", "整数", "所属赛事ID，外键"],
        ["team_id", "整数", "队伍ID，外键"],
        ["total_points", "整数", "总积分"],
        ["matches_won", "整数", "胜场数"],
        ["matches_lost", "整数", "负场数"],
        ["games_won", "整数", "胜局数"],
        ["games_lost", "整数", "负局数"],
        ["points_won", "整数", "得分数"],
        ["points_lost", "整数", "失分数"],
        ["ranking", "整数", "排名"],
        ["update_time", "时间戳", "更新时间"],
      ]),

      new Paragraph({ children: [new PageBreak()] }),
      createHeading1("7. 交付物清单"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("7.1 需求规格说明书")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("7.2 系统设计文档")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("7.3 数据库设计文档")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("7.4 用户手册")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("7.5 系统原型")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("7.6 测试报告")] }),

      createHeading1("8. 项目实施计划"),
      createParagraph("（此处应包含项目各阶段的时间安排和里程碑）"),

      createHeading1("9. 验收标准"),
      createHeading2("9.1 功能验收标准"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("所有功能模块正常运行，满足需求规格说明书中的功能要求")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("比分录入、修正、统计功能准确无误")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("淘汰赛对阵表生成正确")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("多届比赛管理功能正常")] }),

      createHeading2("9.2 性能验收标准"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("系统响应时间符合性能要求")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("数据查询效率满足需求")] }),

      createHeading2("9.3 界面验收标准"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("界面简洁美观，符合极简风格要求")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("响应式设计在PC端和移动端均正常显示")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("操作流程清晰，易于上手")] }),

      createHeading2("9.4 数据安全验收标准"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("数据备份和恢复功能正常")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("数据完整性得到保障")] }),

      new Paragraph({ children: [] }),
      new Paragraph({ children: [] }),
      createParagraph("本需求规格说明书详细描述了羽毛球团体赛管理系统的功能需求和非功能需求，为系统设计和开发提供依据。在系统开发过程中，如有需求变更，应按照变更管理流程进行处理。"),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("d:/AICoding/Program/badminton-tournament-system/doc/羽毛球团体赛管理系统需求规格说明书.docx", buffer);
  console.log("Word文档已生成: 羽毛球团体赛管理系统需求规格说明书.docx");
});
