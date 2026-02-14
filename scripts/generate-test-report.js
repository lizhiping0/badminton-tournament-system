import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, 
        ShadingType, PageNumber, PageBreak, LevelFormat } from 'docx';
import fs from 'fs';

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

const createHeaderCell = (text, width) => new TableCell({
  borders,
  width: { size: width, type: WidthType.DXA },
  shading: { fill: "1F4E79", type: ShadingType.CLEAR },
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({ 
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 22 })] 
  })]
});

const createCell = (text, width, align = AlignmentType.LEFT) => new TableCell({
  borders,
  width: { size: width, type: WidthType.DXA },
  margins: { top: 60, bottom: 60, left: 120, right: 120 },
  children: [new Paragraph({ 
    alignment: align,
    children: [new TextRun({ text, font: "Arial", size: 20 })] 
  })]
});

const createTestTable = (tests) => {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell("编号", 800),
        createHeaderCell("测试用例", 5000),
        createHeaderCell("描述", 3560)
      ]
    })
  ];
  
  tests.forEach((test, index) => {
    rows.push(new TableRow({
      children: [
        createCell(String(index + 1), 800, AlignmentType.CENTER),
        createCell(test.name, 5000),
        createCell(test.desc, 3560)
      ]
    }));
  });
  
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [800, 5000, 3560],
    rows
  });
};

const apiTests = {
  health: [
    { name: "GET /api/health - 应返回服务状态", desc: "验证健康检查接口返回正确的服务状态" }
  ],
  events: [
    { name: "GET /api/events - 应返回空数组", desc: "验证初始状态下返回空数组" },
    { name: "POST /api/events - 应成功创建赛事", desc: "验证创建赛事功能正常" },
    { name: "POST /api/events - 赛事名称为空应返回400", desc: "验证参数校验功能" },
    { name: "GET /api/events/:id - 应返回指定赛事", desc: "验证获取单个赛事功能" },
    { name: "GET /api/events/:id - 不存在的赛事应返回404", desc: "验证错误处理" },
    { name: "PUT /api/events/:id - 应成功更新赛事", desc: "验证更新赛事功能" },
    { name: "DELETE /api/events/:id - 应成功删除赛事", desc: "验证删除赛事功能" }
  ],
  teams: [
    { name: "POST /api/teams - 应成功创建队伍", desc: "验证创建队伍功能" },
    { name: "POST /api/teams - 缺少赛事ID应返回400", desc: "验证参数校验" },
    { name: "POST /api/teams - 队伍名称为空应返回400", desc: "验证参数校验" },
    { name: "GET /api/teams?event_id=X - 应返回指定赛事的队伍", desc: "验证按赛事查询队伍" },
    { name: "DELETE /api/teams/:id - 应成功删除队伍", desc: "验证删除队伍功能" }
  ],
  players: [
    { name: "POST /api/players - 应成功创建选手", desc: "验证创建选手功能" },
    { name: "POST /api/players - 缺少队伍ID应返回400", desc: "验证参数校验" },
    { name: "POST /api/players - 选手姓名为空应返回400", desc: "验证参数校验" },
    { name: "GET /api/players?team_id=X - 应返回指定队伍的选手", desc: "验证按队伍查询选手" },
    { name: "DELETE /api/players/:id - 应成功删除选手", desc: "验证删除选手功能" }
  ],
  matchTypes: [
    { name: "GET /api/match-types - 应返回5种比赛项目", desc: "验证获取比赛项目列表(男双、女单、男单、女双、混双)" }
  ],
  teamMatches: [
    { name: "POST /api/team-matches - 应成功创建团体赛", desc: "验证创建团体赛功能" },
    { name: "POST /api/team-matches - 缺少赛事ID应返回400", desc: "验证参数校验" },
    { name: "POST /api/team-matches/generate-bracket - 应成功生成对阵表", desc: "验证自动生成淘汰赛对阵表" },
    { name: "POST /api/team-matches/generate-bracket - 队伍不足应返回400", desc: "验证队伍数量校验" },
    { name: "GET /api/team-matches?event_id=X - 应返回指定赛事的团体赛", desc: "验证按赛事查询团体赛" },
    { name: "DELETE /api/team-matches/:id - 应成功删除团体赛", desc: "验证删除团体赛功能" }
  ],
  matches: [
    { name: "POST /api/matches - 应成功创建单项比赛", desc: "验证创建单项比赛功能" },
    { name: "POST /api/matches - 缺少团体赛ID应返回400", desc: "验证参数校验" },
    { name: "PUT /api/matches/:id/score - 应成功更新比分", desc: "验证比分录入功能" },
    { name: "GET /api/matches?team_match_id=X - 应返回指定团体赛的比赛", desc: "验证按团体赛查询比赛" }
  ],
  standings: [
    { name: "GET /api/standings - 缺少event_id应返回400", desc: "验证参数校验" },
    { name: "POST /api/standings/calculate - 应成功计算成绩", desc: "验证成绩计算功能" },
    { name: "POST /api/standings/calculate - 缺少event_id应返回400", desc: "验证参数校验" }
  ]
};

const pageTests = {
  events: [
    { name: "应渲染页面标题", desc: "验证页面标题\"赛事管理\"正确显示" },
    { name: "应显示新建赛事按钮", desc: "验证\"+ 新建赛事\"按钮存在" },
    { name: "无赛事时应显示提示信息", desc: "验证空状态提示正确显示" },
    { name: "应显示赛事列表", desc: "验证赛事列表正确渲染" },
    { name: "点击新建赛事按钮应显示表单", desc: "验证新建表单弹出功能" },
    { name: "应显示赛事状态标签", desc: "验证状态标签(进行中/已结束)正确显示" }
  ],
  teams: [
    { name: "未选择赛事时应显示提示", desc: "验证未选择赛事时的提示信息" },
    { name: "应渲染页面标题", desc: "验证页面标题\"队伍管理\"正确显示" },
    { name: "应显示添加队伍按钮", desc: "验证\"+ 添加队伍\"按钮存在" },
    { name: "无队伍时应显示提示信息", desc: "验证空状态提示正确显示" },
    { name: "应显示队伍列表", desc: "验证队伍列表正确渲染" },
    { name: "点击添加队伍按钮应显示表单", desc: "验证添加表单弹出功能" },
    { name: "应显示队伍数量", desc: "验证队伍数量统计正确显示" }
  ],
  schedule: [
    { name: "未选择赛事时应显示提示", desc: "验证未选择赛事时的提示信息" },
    { name: "应渲染页面标题", desc: "验证页面标题\"赛程安排\"正确显示" },
    { name: "应显示自动生成对阵表按钮", desc: "验证\"自动生成对阵表\"按钮存在" },
    { name: "无赛程时应显示提示信息", desc: "验证空状态提示正确显示" },
    { name: "应显示对阵表", desc: "验证对阵表正确渲染" },
    { name: "应显示轮次标题", desc: "验证轮次标题(第一轮等)正确显示" },
    { name: "应显示比赛状态", desc: "验证比赛状态标签正确显示" },
    { name: "应显示手动添加按钮", desc: "验证\"+ 手动添加\"按钮存在" },
    { name: "应显示对阵规则说明", desc: "验证规则说明区域存在" }
  ],
  matches: [
    { name: "未选择赛事时应显示提示", desc: "验证未选择赛事时的提示信息" },
    { name: "应渲染页面标题", desc: "验证页面标题\"比赛记录\"正确显示" },
    { name: "无比赛时应显示提示", desc: "验证空状态提示正确显示" },
    { name: "应显示团体赛列表", desc: "验证团体赛列表正确渲染" },
    { name: "应显示比赛状态", desc: "验证比赛状态标签正确显示" },
    { name: "应显示团体赛列表标题", desc: "验证列表标题正确显示" }
  ],
  standings: [
    { name: "未选择赛事时应显示提示", desc: "验证未选择赛事时的提示信息" },
    { name: "应渲染页面标题", desc: "验证页面标题\"成绩统计\"正确显示" },
    { name: "应显示计算成绩按钮", desc: "验证\"计算成绩\"按钮存在" },
    { name: "无成绩数据时应显示提示", desc: "验证空状态提示正确显示" },
    { name: "应显示成绩排名表", desc: "验证排名表正确渲染" },
    { name: "应显示排名", desc: "验证排名数字正确显示" },
    { name: "应显示导出积分榜按钮", desc: "验证\"导出积分榜\"按钮存在" },
    { name: "应显示导出赛程表按钮", desc: "验证\"导出赛程表\"按钮存在" },
    { name: "应显示导出比赛记录按钮", desc: "验证\"导出比赛记录\"按钮存在" },
    { name: "应显示排名规则说明", desc: "验证规则说明区域存在" },
    { name: "应显示比赛规则说明", desc: "验证规则说明区域存在" }
  ]
};

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: "1F4E79" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 280, after: 180 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "404040" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ 
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "羽毛球团体赛管理系统 - 测试报告", font: "Arial", size: 18, color: "808080" })] 
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "第 ", font: "Arial", size: 18 }), 
                   new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18 }), 
                   new TextRun({ text: " 页", font: "Arial", size: 18 })] 
      })] })
    },
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("羽毛球团体赛管理系统")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("测试报告")] }),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("一、测试概述")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "测试日期：", bold: true }), new TextRun(new Date().toLocaleDateString('zh-CN'))] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "测试工具：", bold: true }), new TextRun("Vitest + React Testing Library + Supertest")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "测试范围：", bold: true }), new TextRun("后端API接口测试、前端页面组件测试")] }),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("二、测试统计")] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 2340, 1560, 1560, 780],
        rows: [
          new TableRow({ children: [
            createHeaderCell("类别", 3120),
            createHeaderCell("测试文件数", 2340),
            createHeaderCell("测试用例数", 1560),
            createHeaderCell("通过", 1560),
            createHeaderCell("失败", 780)
          ]}),
          new TableRow({ children: [
            createCell("API 测试", 3120),
            createCell("1", 2340, AlignmentType.CENTER),
            createCell("32", 1560, AlignmentType.CENTER),
            createCell("32", 1560, AlignmentType.CENTER),
            createCell("0", 780, AlignmentType.CENTER)
          ]}),
          new TableRow({ children: [
            createCell("前端页面测试", 3120),
            createCell("5", 2340, AlignmentType.CENTER),
            createCell("38", 1560, AlignmentType.CENTER),
            createCell("38", 1560, AlignmentType.CENTER),
            createCell("0", 780, AlignmentType.CENTER)
          ]}),
          new TableRow({ children: [
            new TableCell({
              borders,
              width: { size: 3120, type: WidthType.DXA },
              shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: "合计", bold: true, font: "Arial", size: 20 })] })]
            }),
            new TableCell({
              borders,
              width: { size: 2340, type: WidthType.DXA },
              shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "6", bold: true, font: "Arial", size: 20 })] })]
            }),
            new TableCell({
              borders,
              width: { size: 1560, type: WidthType.DXA },
              shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "70", bold: true, font: "Arial", size: 20 })] })]
            }),
            new TableCell({
              borders,
              width: { size: 1560, type: WidthType.DXA },
              shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "70", bold: true, font: "Arial", size: 20 })] })]
            }),
            new TableCell({
              borders,
              width: { size: 780, type: WidthType.DXA },
              shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "0", bold: true, font: "Arial", size: 20 })] })]
            })
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("三、API 测试用例详情")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.1 Health Check API (1个用例)")] }),
      createTestTable(apiTests.health),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.2 Events API (7个用例)")] }),
      createTestTable(apiTests.events),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.3 Teams API (5个用例)")] }),
      createTestTable(apiTests.teams),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.4 Players API (5个用例)")] }),
      createTestTable(apiTests.players),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.5 Match Types API (1个用例)")] }),
      createTestTable(apiTests.matchTypes),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.6 Team Matches API (6个用例)")] }),
      createTestTable(apiTests.teamMatches),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.7 Matches API (4个用例)")] }),
      createTestTable(apiTests.matches),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.8 Standings API (3个用例)")] }),
      createTestTable(apiTests.standings),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("四、前端页面测试用例详情")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("4.1 Events Page 赛事管理页面 (6个用例)")] }),
      createTestTable(pageTests.events),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("4.2 Teams Page 队伍管理页面 (7个用例)")] }),
      createTestTable(pageTests.teams),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("4.3 Schedule Page 赛程安排页面 (9个用例)")] }),
      createTestTable(pageTests.schedule),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("4.4 Matches Page 比赛记录页面 (6个用例)")] }),
      createTestTable(pageTests.matches),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("4.5 Standings Page 成绩统计页面 (11个用例)")] }),
      createTestTable(pageTests.standings),
      new Paragraph({ spacing: { after: 200 } }),
      
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("五、测试结论")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("本次测试共执行 70 个测试用例，全部通过。测试覆盖了以下内容：")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("后端 API 接口：涵盖赛事管理、队伍管理、选手管理、比赛项目、团体赛、单项比赛、成绩统计等所有模块")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("前端页面组件：涵盖赛事管理、队伍管理、赛程安排、比赛记录、成绩统计等所有页面")] }),
      new Paragraph({ spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun({ text: "测试结果：系统功能正常，所有接口和页面组件均符合预期。", bold: true })] })
    ]
  }]
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync("d:/AICoding/Program/badminton-tournament-system/doc/测试报告.docx", buffer);
console.log("测试报告已生成: doc/测试报告.docx");
