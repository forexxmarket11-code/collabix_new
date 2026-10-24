import { FeatureCard, HowItWorksStep } from '../types';

export const WHY_COLLABIX_FEATURES: FeatureCard[] = [
  {
    id: 'why-1',
    number: '01',
    title: 'Tekshirilgan profillar',
    description: "Platformadagi har bir blogerning auditoriyasi, faollik darajasi (ER) va haqiqiy qamrovi soxta ko'rsatkichlardan xoli ekanligi sinchiklab moderatsiyadan o'tkaziladi.",
    metric: '100%',
    metricLabel: "Haqiqiy auditoriya tahlili",
  },
  {
    id: 'why-2',
    number: '02',
    title: 'Sodda brif',
    description: "Vaqtingizni tejash uchun loyiha maqsadi, talab va formatlarni bir necha daqiqada aniq shakllantiring va darhol tegishli kreatorga yo'naltiring.",
    metric: '3 daqiqa',
    metricLabel: "Brif tayyorlash vaqti",
  },
  {
    id: 'why-3',
    number: '03',
    title: "To'g'ridan-to'g'ri muloqot",
    description: "Vositachilarsiz va ortiqcha byurokratiyasiz bevosita kreator bilan aloqa o'rnating, tafsilotlarni tezkor va aniq kelishing.",
    metric: '24 soat',
    metricLabel: "O'rtacha javob berish tezligi",
  },
];

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: '01',
    title: "Katalogni ko'rish",
    description: "Brendingiz yo'nalishiga, maqsadli qamroviga va auditoriya demografiyasiga mos keladigan eng sara kreatorlarni filtrlang.",
    highlight: "Soha & formatlar bo'yicha saralash",
  },
  {
    step: '02',
    title: 'Profilni ochish',
    description: "Kreatorning ochiq tahliliy statistikasi, auditoriya faolligi (ER) va avvalgi muvaffaqiyatli keyslarini batafsil o'rganing.",
    highlight: "Shaffof metrikalar va keyslar",
  },
  {
    step: '03',
    title: "Bog'lanish",
    description: "Platforma orqali bevosita brifingizni yuboring va bir necha soat ichida samarali reklama integratsiyasini boshlang.",
    highlight: "To'g'ridan-to'g'ri kelishuv",
  },
];
