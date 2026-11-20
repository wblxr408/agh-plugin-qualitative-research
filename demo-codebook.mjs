// Evidence is kept only when the indicated pattern matches the source segment.
export const demoRules = [
  {
    title: '法规与废弃物认定',
    explanation: '废弃物身份、监管手续和技术标准影响副产物是否可以进入另一条生产链。',
    labels: [
      ['废弃物认定', /\b(?:considered waste|classified as waste|waste status|classified as hazardous)\b/iu],
      ['欧盟与本国法规', /\b(?:legislation|EU regulations?|European directives?)\b/iu],
      ['行政手续', /\b(?:bureaucracy|administrative|paperwork|documentation)\b/iu],
      ['许可证与批准', /\b(?:permits?|licen[cs]es?|authori[sz]ation|approvals?)\b/iu],
      ['认证要求', /\b(?:certifi\w+|accredit\w+)\b/iu],
      ['质量要求与标准', /\b(?:quality requirements?|standards?|quality criteria|specifications?)\b/iu],
      ['监管与检查', /\b(?:inspection\w*|regulator\w*|control authorities)\b/iu],
    ],
  },
  {
    title: '经费与成本分摊',
    explanation: '合作能否启动取决于资金渠道和前期投入，能否持续还取决于费用与收益分配。',
    labels: [
      ['资金与融资条件', /\b(?:funding|financing|financial support|financial resources)\b/iu],
      ['补贴与公共招标', /\b(?:subsid\w+|grants?|tenders?|public calls?)\b/iu],
      ['前期投资', /\b(?:investment\w*|capital costs?)\b/iu],
      ['运输费用', /\b(?:transport(?:ation)? costs?|logistics costs?|cost of (?:transport|delivery))\b/iu],
      ['处置与处理费用', /\b(?:disposal costs?|treatment costs?|landfill fees?|cost of disposal)\b/iu],
      ['价格和收益', /\b(?:prices?|profit\w*|revenues?|financial benefits?)\b/iu],
      [
        '经济可行性',
        /\b(?:economic\w* (?:viab\w*|feasib\w*|justifi\w*)|cost.effectiv\w*|economically|costs? outweigh)\b/iu,
      ],
      [
        '分摊投入和收益',
        /\b(?:sharing (?:financial|costs?|results?|benefits?)|cost.sharing|share the costs?)\b/iu,
      ],
    ],
  },
  {
    title: '供应、设施与物流',
    explanation: '副产物数量、供给规律和运输距离决定供需能否匹配，场地、设备及设施容量决定可处理规模。',
    labels: [
      ['处理容量', /\b(?:capacity|capacities|throughput)\b/iu],
      ['储存与场所', /\b(?:storage|warehouse\w*|depots?|storage space|stockpil\w+)\b/iu],
      ['设备与工艺设施', /\b(?:equipment|machinery|processing plants?|treatment facilities)\b/iu],
      ['运输与原料流转', /\b(?:transport\w*|logistics|deliver\w*|trucks?)\b/iu],
      ['运输距离与区位', /\b(?:distance\w*|kilomet[er]+s?|remote|nearby|proximity)\b/iu],
      ['供应数量和规模', /\b(?:tonnes?|tons?|quantities|quantity|volumes?|scale)\b/iu],
      ['供给时序和稳定性', /\b(?:seasonal\w*|regular\w*|continuous\w*|fluctuat\w*|stable supply)\b/iu],
      ['原料与供需匹配', /\b(?:raw materials?|supply and demand|material flows?)\b/iu],
    ],
  },
  {
    title: '材料利用与技术路径',
    explanation: '副产物从处置转向利用，需要按来源、成分与用途选择相应的回收和处理路径。',
    labels: [
      ['生产副产物', /\b(?:by.products?|production waste|process waste)\b/iu],
      ['剩余材料', /\b(?:residues?|surplus material\w*|leftovers?)\b/iu],
      ['再利用', /\b(?:reus\w+|use again|secondary use)\b/iu],
      ['回收与分选', /\b(?:recycl\w+|sorting|separation)\b/iu],
      ['有机处理与堆肥', /\b(?:compost\w*|digest\w*|organic waste|biomass)\b/iu],
      ['建材与土方应用', /\b(?:construction material\w*|aggregates?|concrete|excavat\w*|soil)\b/iu],
      ['产品研发与技术验证', /\b(?:laborator\w*|prototypes?|R&D|material testing|technolog\w*)\b/iu],
      ['能源与余热利用', /\b(?:waste heat|energy recovery|heat exchang\w*|biogas|fuel)\b/iu],
    ],
  },
  {
    title: '伙伴关系与信任',
    explanation: '信任可能来自既有接触、信息透明和共同经验，也会受竞争、不愿分享和观望态度制约。',
    labels: [
      ['信任建立', /\b(?:trust|mistrust|trusted)\b/iu],
      ['既有伙伴与关系', /\b(?:partners?|partnerships?|informal circles|personal contacts)\b/iu],
      ['合作意愿与观望', /\b(?:willing\w*|interest\w*|reluctan\w*|hesitan\w*)\b/iu],
      ['竞争与风险顾虑', /\b(?:competit\w+|risks?|uncertain\w*)\b/iu],
      ['信息交流', /\b(?:information shar\w*|communicat\w+|exchange information|transparen\w*)\b/iu],
      [
        '共同项目与经验',
        /\b(?:joint projects?|pilot projects?|previous cooperation|past experience|good practice)\b/iu,
      ],
    ],
  },
  {
    title: '地方组织与协作治理',
    explanation: '地方机构、企业、科研单位和中介可承担不同的组织角色，促进供需对接与行动协调。',
    labels: [
      ['合作协调', /\b(?:coordinat\w*|collaborat\w*|cooperat\w*)\b/iu],
      ['市政与地方公共机构', /\b(?:municipal\w*|local authorit\w*|local government\w*)\b/iu],
      ['科研与教育机构', /\b(?:universit\w*|research institute\w*|faculty|faculties|students?)\b/iu],
      ['企业与行业角色', /\b(?:enterprise\w*|industrial companies|industry|small companies|SMEs?)\b/iu],
      ['网络与撮合中介', /\b(?:networks?|platform\w*|facilitat\w*|intermediar\w*)\b/iu],
      ['跨部门协作', /\b(?:stakeholders?|cross.sector\w*|different sectors|public.private)\b/iu],
      [
        '地方资源与区域网络',
        /\b(?:local environment|local communit\w*|regional\w*|local organizations?)\b/iu,
      ],
    ],
  },
  {
    title: '环境目标与转型条件',
    explanation: '减废、减排和资源节约为合作提供理由；实践仍受到需求、意识和组织能力的影响。',
    labels: [
      ['循环经济目标', /\b(?:circular economy|circularity|circular solutions?)\b/iu],
      ['废弃物预防与减量', /\b(?:waste reduc\w*|reduce waste|waste prevention|less waste)\b/iu],
      ['环境影响', /\b(?:environmental impact\w*|pollution|environmental protection|environmentally)\b/iu],
      ['排放与碳足迹', /\b(?:emissions?|carbon footprint|CO2|greenhouse)\b/iu],
      ['资源节约', /\b(?:resource efficien\w*|resource sav\w*|save resources|less raw material)\b/iu],
      ['可持续发展', /\b(?:sustainab\w+|green transition)\b/iu],
      ['认知、教育与推广', /\b(?:awareness|education|training|promotion)\b/iu],
    ],
  },
]
