// Тестовий контент для прототипу: 30 карток, 3+3 фінали.
// Тон: чорна іронія без пафосу; вигадані люди й частини; без рахунку вбитих.

import type { Card, Ending } from '../src/types.ts';

export const TEST_CARDS: Card[] = [
  {
    id: 'call.paper',
    kind: 'event',
    phase: [1],
    once: true,
    text: 'Повістка в поштовій скриньці. Папір щільний, пахне свіжою фарбою. Мама каже: «Може, помилка». Ти вже знаєш, що не помилка.',
    options: [
      {
        id: 'hide',
        text: 'Сховати повістку під стос газет і нічого не казати',
        effects: { stats: { energy: -1, trust: 1 }, flags: { hid_call: true }, journal: 'Сховав повістку.' },
      },
      {
        id: 'tell',
        text: 'Показати мамі й разом піти до військкомату',
        effects: { stats: { bonds: 1, trust: 1, energy: -1 }, journal: 'Пішов до військкомату з мамою.' },
      },
      {
        id: 'ask_friend',
        text: 'Зателефонувати другові, який уже відслужив',
        requires: { skillAtLeast: { people: 1 } },
        effects: { stats: { understanding: 2, bonds: 1 }, skills: { people: 1 }, journal: 'Друг розповів, як це насправді.' },
      },
    ],
  },
  {
    id: 'call.queue',
    kind: 'system',
    phase: [1],
    text: 'Черга у військкоматі. Хтось попереду жартує, що беруть усіх, у кого є пульс. Ніхто не сміється.',
    options: [
      { id: 'silent', text: 'Стояти мовчки й слухати', effects: { stats: { understanding: 1, energy: -1 } } },
      {
        id: 'talk',
        text: 'Запитати в чоловіка попереду, куди розподіляють',
        effects: { stats: { understanding: 1, bonds: 1 } },
      },
      {
        id: 'leave',
        text: 'Спробувати вийти з черги й піти додому',
        effects: { stats: { health: -2, trust: -1, supplies: -1 }, flags: { tried_to_leave: true } },
      },
    ],
  },
  {
    id: 'call.medical',
    kind: 'routine',
    phase: [1],
    text: 'Медкомісія. Лікар дивиться в бланк, не на тебе. «Скарги є?» — питає так, ніби відповідь уже надрукована.',
    options: [
      {
        id: 'complain',
        text: 'Сказати про коліно, яке ниє з зими',
        effects: { stats: { health: 1, trust: -1 }, flags: { knee_noted: true } },
      },
      { id: 'silent', text: '«Немає».', effects: { stats: { trust: 1, understanding: -1 } } },
      {
        id: 'joke',
        text: '«Є — алергія на дурнів»',
        effects: { stats: { trust: -2, energy: 1 }, skills: { drill: 1 } },
      },
    ],
  },
  {
    id: 'phase2.bus',
    kind: 'event',
    phase: [2],
    once: true,
    text: 'Автобус із запітнілими вікнами везе вас на схід. Хтось намагається заснути, хтось — доїсти домашнє. Водій мовчить усі шість годин.',
    options: [
      {
        id: 'watch',
        text: 'Дивитися у вікно й рахувати блокпости',
        effects: { stats: { understanding: 2, energy: -1 }, journal: 'Порахував вісім блокпостів.' },
      },
      {
        id: 'share',
        text: 'Роздати свої пиріжки сусідам',
        effects: { stats: { supplies: -2, bonds: 2 } },
      },
      {
        id: 'sleep',
        text: 'Спати, поки дають',
        effects: { stats: { energy: 2, understanding: -1 } },
      },
    ],
  },
  {
    id: 'phase2.sapper',
    kind: 'person',
    phase: [2, 3],
    character: 'Сапер Толік',
    text: 'Толік, сапер із третьої роти, показує тобі «правильний» спосіб сидіти в окопі. Каже, що його вчив прапорщик, який воює з 2015-го.',
    options: [
      {
        id: 'learn',
        text: 'Записати в блокнот і перепитати двічі',
        effects: { skills: { survival: 1 }, stats: { understanding: 1, energy: -1 }, flags: { knows_okop: true } },
      },
      {
        id: 'skeptic',
        text: 'Сказати, що це все одно не допоможе',
        effects: { stats: { bonds: -1, understanding: 1 } },
      },
      {
        id: 'ask_why',
        text: 'Запитати, скільки з тих, кого він учив, ще живі',
        requires: { skillAtLeast: { people: 1 } },
        effects: { stats: { understanding: 2, bonds: 1, energy: -1 }, flags: { tolko_honest: true } },
      },
    ],
  },
  {
    id: 'phase2.soup',
    kind: 'routine',
    phase: [2, 3],
    text: 'Польова кухня. У каструлі щось, що називають борщем. Хлопець поруч упевнено каже: «Головне — гаряче».',
    options: [
      { id: 'eat', text: 'З\'їсти й подякувати', effects: { stats: { health: 1, energy: 1, supplies: -1 } } },
      {
        id: 'point',
        text: 'Показати кухареві, що в каструлі плаває папір від мішка',
        effects: { stats: { bonds: -1, trust: -1, understanding: 1 } },
      },
      {
        id: 'skip',
        text: 'Віддати свою порцію хлопцеві з сусіднього відділення',
        effects: { stats: { bonds: 2, energy: -1, health: -1, supplies: -1 } },
      },
    ],
  },
  {
    id: 'phase2.phone',
    kind: 'event',
    phase: [2, 3],
    text: 'Мама телефонує. Голос тремтить: по телевізору кажуть, що все добре. Ти дивишся на розбите вікно казарми.',
    options: [
      {
        id: 'lie',
        text: '«Усе добре, мамо»',
        effects: { stats: { bonds: 1, understanding: 1, energy: -1 }, journal: 'Збрехав мамі.' },
      },
      {
        id: 'truth',
        text: 'Сказати правду, коротко',
        effects: { stats: { bonds: -1, trust: -1, understanding: 2 } },
      },
      {
        id: 'hold',
        text: 'Мовчати й слухати, як вона плаче',
        effects: { stats: { bonds: 2, energy: -2 } },
      },
    ],
  },
  {
    id: 'phase2.split',
    kind: 'system',
    phase: [2, 3],
    text: 'Прапорщик будує роту. Каже: «Хто хоче в штурмову — крок уперед». Ніхто не рухається. Він обирає сам.',
    options: [
      {
        id: 'volunteer',
        text: 'Вийди першим, поки не обрали',
        effects: { stats: { health: -2, trust: 2, bonds: 1 }, flags: { assault: true }, journal: 'Пішов у штурмову добровільно.' },
      },
      {
        id: 'hide',
        text: 'Стати за широку спину сусіда',
        effects: { stats: { trust: -2, understanding: 1, energy: -1 } },
      },
      {
        id: 'ask_where',
        text: 'Запитати, куди саме й на скільки',
        requires: { skillAtLeast: { system: 1 } },
        effects: { stats: { trust: -1, understanding: 2 }, flags: { asked_orders: true } },
      },
    ],
  },
  {
    id: 'phase3.trench',
    kind: 'event',
    phase: [3],
    text: 'Твій окоп глибший за сусідський на лопату. Сусід каже, що тобі просто пощастило з місцем. Ти знаєш, скільки ночей його копав.',
    options: [
      {
        id: 'share_spot',
        text: 'Запросити сусіда пересидіти обстріл разом',
        effects: { stats: { bonds: 2, health: -1, energy: -1 }, flags: { shared_trench: true } },
      },
      {
        id: 'keep',
        text: 'Нічого не казати',
        effects: { stats: { health: 1, bonds: -1 } },
      },
      {
        id: 'teach',
        text: 'Показати, як правильно копати',
        requires: { skillAtLeast: { survival: 1 } },
        effects: { stats: { bonds: 2, energy: -2 }, skills: { people: 1 } },
      },
    ],
  },
  {
    id: 'phase3.water',
    kind: 'routine',
    phase: [3, 4],
    text: 'Вода в баклазі пахне металом. Усі п’ють. Ти згадуєш, що казав Толік про воду з відстійників.',
    options: [
      {
        id: 'drink',
        text: 'Пити, бо хочеться',
        effects: { stats: { health: -1, energy: 1 } },
      },
      {
        id: 'boil',
        text: 'Прокип’ятити на буржуйці',
        requires: { skillAtLeast: { survival: 1 } },
        effects: { stats: { health: 1, supplies: -1, energy: -1 } },
      },
      {
        id: 'warn',
        text: 'Попередити відділення',
        effects: { stats: { bonds: 1, trust: -1, understanding: 1 } },
      },
    ],
  },
  {
    id: 'phase3.loss',
    kind: 'event',
    phase: [3, 4],
    once: true,
    text: 'Уночі «приліт» забирає сусідній бліндаж. Уранці на тому місці збирають речі. Хтось питає, чия це куртка. Ти впізнаєш куртку.',
    options: [
      {
        id: 'say',
        text: 'Сказати, чия це',
        effects: { stats: { bonds: 2, understanding: 1, energy: -2 }, journal: 'Сказав, чия була куртка.' },
      },
      {
        id: 'silent',
        text: 'Промовчати',
        effects: { stats: { understanding: -1, energy: -1, bonds: -1 } },
      },
      {
        id: 'letter',
        text: 'Запам’ятати ім’я, щоб потім написати рідним',
        effects: { stats: { bonds: 1, understanding: 2 }, flags: { will_write_letter: true } },
      },
    ],
  },
  {
    id: 'phase3.propaganda',
    kind: 'system',
    phase: [3, 4],
    text: 'У бліндажі по рації передають зведення. Цифри втрат «ворога» звучать так упевнено, що хочеться повірити. Хтось поруч тихо рахує на пальцях.',
    options: [
      {
        id: 'believe',
        text: 'Повірити, хоч на хвилину',
        effects: { stats: { trust: 2, understanding: -2 } },
      },
      {
        id: 'count',
        text: 'Порахувати разом із сусідом',
        effects: { stats: { understanding: 2, trust: -1, bonds: 1 } },
      },
      {
        id: 'turn_off',
        text: 'Вимкнути рацію',
        effects: { stats: { trust: -1, energy: 1 } },
      },
    ],
  },
  {
    id: 'phase3.medic',
    kind: 'person',
    phase: [3, 4],
    character: 'Санінструкторка Оля',
    text: 'Оля, санінструкторка, каже, що джгут треба накладати вище, ніж усі думають. Каже тихо, ніби ділиться краденим.',
    options: [
      {
        id: 'remember',
        text: 'Перепитати й повторити вголос',
        effects: { skills: { survival: 1 }, stats: { understanding: 1, bonds: 1 } },
      },
      {
        id: 'mock',
        text: '«Та я й так знаю»',
        effects: { stats: { bonds: -1, trust: 1, understanding: -1 } },
      },
      {
        id: 'ask_supplies',
        text: 'Запитати, скільки джгутів реально є',
        requires: { skillAtLeast: { people: 1 } },
        effects: { stats: { understanding: 2, bonds: 1, energy: -1 }, flags: { knows_jgut_count: true } },
      },
    ],
  },
  {
    id: 'phase3.break',
    kind: 'event',
    phase: [3, 4],
    text: 'Третій день без сну. Руки тремтять, думки плутаються. Командир каже, що це «нормально».',
    options: [
      {
        id: 'rest',
        text: 'Попросити відпочинок, навіть якщо це «не по-чоловічому»',
        effects: { stats: { energy: 3, trust: -1 } },
      },
      {
        id: 'hold',
        text: 'Триматися далі',
        effects: { stats: { health: -2, trust: 1, energy: 1 } },
      },
      {
        id: 'help',
        text: 'Допомогти хлопцеві поруч заснути хоч на годину',
        effects: { stats: { bonds: 2, energy: -1 } },
      },
    ],
  },
  {
    id: 'phase3.bribe',
    kind: 'system',
    phase: [3, 4],
    text: 'Тиловий прапорщик пропонує «вирішити питання» з переведенням у другий ешелон. Ціна — три тисячі й мовчання.',
    options: [
      {
        id: 'pay',
        text: 'Заплатити',
        requires: { statAtLeast: { supplies: 4 } },
        effects: { stats: { supplies: -4, health: 1, trust: -1 }, flags: { who_paid: true } },
      },
      {
        id: 'refuse',
        text: 'Відмовитись',
        effects: { stats: { understanding: 1, bonds: 1, trust: -1 } },
      },
      {
        id: 'report',
        text: 'Написати рапорт',
        requires: { skillAtLeast: { system: 2 } },
        effects: { stats: { trust: -3, understanding: 2, bonds: -1 }, flags: { reported: true } },
      },
    ],
  },
  {
    id: 'phase4.cold',
    kind: 'event',
    phase: [4, 5],
    text: 'Мороз крізь спальник. Спальник — не твій, тобі віддав сусід. Уночі він кашляє.',
    options: [
      {
        id: 'return',
        text: 'Віддати спальник назад',
        effects: { stats: { health: -2, bonds: 3, energy: -1 } },
      },
      { id: 'keep', text: 'Залишити собі', effects: { stats: { health: 1, bonds: -2 } } },
      {
        id: 'find',
        text: 'Знайти ще щось тепле на сусідній позиції',
        requires: { skillAtLeast: { survival: 2 } },
        effects: { stats: { supplies: 1, bonds: 2, energy: -1 } },
      },
    ],
  },
  {
    id: 'phase4.letters',
    kind: 'routine',
    phase: [4, 5],
    text: 'Хлопець питає, як писати листи рідним. У нього вже три написаних, і жоден не відправлений.',
    options: [
      {
        id: 'help',
        text: 'Допомогти написати коротко й чесно',
        effects: { stats: { bonds: 2, understanding: 1, energy: -1 }, flags: { letters_help: true } },
      },
      {
        id: 'joke',
        text: 'Сказати, що пошта все одно не дійде',
        effects: { stats: { understanding: 1, bonds: -1 } },
      },
      {
        id: 'send',
        text: 'Знайти того, хто виїде на ротацію, і передати',
        requires: { skillAtLeast: { people: 2 } },
        effects: { stats: { bonds: 3, supplies: -1 } },
      },
    ],
  },
  {
    id: 'phase4.doubt',
    kind: 'event',
    phase: [4, 5],
    text: 'Уночі, коли всі сплять, ти ловиш себе на думці: «А що, як нас тут узагалі немає причини тримати?» Потім згадуєш, що за цю думку ти вже комусь не довіряєш.',
    options: [
      {
        id: 'write',
        text: 'Записати цю думку в блокнот',
        effects: { stats: { understanding: 3, energy: -1 } },
      },
      {
        id: 'suppress',
        text: 'Наказати собі не думати про це',
        effects: { stats: { understanding: -2, trust: 1, health: -1 } },
      },
      {
        id: 'share_doubt',
        text: 'Сказати Толікові',
        requires: { flagTrue: ['tolko_honest'] },
        effects: { stats: { understanding: 2, bonds: 2 }, flags: { doubt_shared: true } },
      },
    ],
  },
  {
    id: 'phase4.standing',
    kind: 'person',
    phase: [4, 5],
    character: 'Командир Нєвмєржицький',
    text: 'Командир роти збирає тих, хто ще вміє думати. Каже: «Мені потрібні люди не для подвигів, а для того, щоб вижити».',
    options: [
      {
        id: 'accept',
        text: 'Погодитись',
        effects: { stats: { understanding: 1, bonds: 1, health: -1 }, flags: { commander_trusts: true } },
      },
      {
        id: 'refuse',
        text: 'Відмовитись — відповідальність не потрібна',
        effects: { stats: { trust: -1, energy: 1 } },
      },
      {
        id: 'ask_plan',
        text: 'Запитати, у чому план полягає насправді',
        requires: { skillAtLeast: { system: 2 } },
        effects: { stats: { understanding: 3, bonds: 1 }, flags: { knows_plan: true } },
      },
    ],
  },
  {
    id: 'phase4.desert',
    kind: 'event',
    phase: [4, 5],
    once: true,
    text: 'Двоє з відділення пішли вночі. Уранці це називають «зрадою». Ти сам думав про це дев’ять ночей.',
    options: [
      {
        id: 'condemn',
        text: 'Підтримати розмову про зраду',
        effects: { stats: { trust: 1, understanding: -2, bonds: -1 } },
      },
      {
        id: 'silence',
        text: 'Мовчати',
        effects: { stats: { understanding: 1, trust: -1, energy: -1 } },
      },
      {
        id: 'understand',
        text: 'Сказати, що розумієш їх',
        effects: { stats: { understanding: 2, bonds: 1, trust: -1 }, flags: { spoke_for_them: true } },
      },
    ],
  },
  {
    id: 'phase5.lastpost',
    kind: 'event',
    phase: [5],
    once: true,
    text: 'Наказ тримати позицію. Ніхто не пояснює навіщо. Рація шипить.',
    options: [
      {
        id: 'hold',
        text: 'Тримати',
        effects: { stats: { health: -2, trust: 2 }, flags: { held_post: true } },
      },
      {
        id: 'dig',
        text: 'Поглибити окоп, поки є час',
        effects: { stats: { energy: -2, health: 1, supplies: -1 }, skills: { survival: 1 } },
      },
      {
        id: 'gather',
        text: 'Зібрати хлопців і поговорити, що робити, якщо тихо не стане',
        effects: { stats: { bonds: 2, understanding: 1, energy: -1 }, flags: { last_talk: true } },
      },
    ],
  },
  {
    id: 'phase5.epitaph',
    kind: 'event',
    phase: [5],
    once: true,
    text: 'Хтось із хлопців питає: «Якщо що — що про нас скажуть?» Усі сміються. Потім тихо.',
    options: [
      {
        id: 'joke',
        text: '«Що ми добре копали»',
        effects: { stats: { energy: 1, bonds: 1, understanding: 1 }, flags: { joke_epitaph: true } },
      },
      {
        id: 'honest',
        text: '«Що ми не хотіли тут бути»',
        effects: { stats: { understanding: 2, bonds: 1, energy: -1 }, flags: { honest_epitaph: true } },
      },
      {
        id: 'nothing',
        text: '«Нічого. Не скажуть»',
        effects: { stats: { understanding: 1, energy: -1 } },
      },
    ],
  },
  {
    id: 'phase2.commander_orders',
    kind: 'system',
    phase: [2, 3],
    text: 'Новий наказ: щоденна муштра на плацу, попри мороз. «Солдат має виглядати солдатом».',
    options: [
      {
        id: 'attend',
        text: 'Сумлінно ходити',
        effects: { skills: { drill: 1 }, stats: { health: -1, energy: -1, trust: 1 } },
      },
      {
        id: 'skip',
        text: 'Пропускати під приводом нарядів',
        effects: { stats: { trust: -1, energy: 1 }, skills: { system: 1 } },
      },
      {
        id: 'pointless',
        text: 'Запитати, навіщо це в окопі',
        effects: { stats: { trust: -2, understanding: 2, bonds: 1 } },
      },
    ],
  },
  {
    id: 'phase3.food_ration',
    kind: 'routine',
    phase: [3, 4],
    text: 'Пакунок від волонтерів. Три шоколадки, два носки й записка «Тримайтесь, хлопці». Носки однакові.',
    options: [
      {
        id: 'split',
        text: 'Розділити по-чесному',
        effects: { stats: { supplies: 2, bonds: 2, energy: 1 } },
      },
      {
        id: 'keep',
        text: 'Забрати собі, бо ти гірше забезпечений',
        effects: { stats: { supplies: 3, bonds: -2, trust: 1 } },
      },
      {
        id: 'write_back',
        text: 'Записати адресу волонтерів, щоб подякувати',
        effects: { stats: { bonds: 1, understanding: 1 }, flags: { thanks_volunteers: true } },
      },
    ],
  },
  {
    id: 'phase4.wound',
    kind: 'event',
    phase: [4, 5],
    text: 'Уламок зайшов у стегно. Оля каже, що дійде й так. Каже це швидше собі.',
    options: [
      {
        id: 'stay',
        text: 'Лишитись на позиції',
        effects: { stats: { health: -3, trust: 2, bonds: 1 }, flags: { wounded_stayed: true } },
      },
      {
        id: 'evac',
        text: 'Дозволити відправити себе в тил',
        effects: { stats: { health: 3, trust: -2, understanding: 1 } },
      },
      {
        id: 'self_help',
        text: 'Обробити сам, як учила Оля',
        requires: { flagTrue: ['knows_jgut_count'] },
        effects: { stats: { health: -1, energy: -2 }, skills: { survival: 1 } },
      },
    ],
  },
  {
    id: 'phase5.silence',
    kind: 'event',
    phase: [5],
    text: 'Тиша. Довго. Хлопці починають шепотітися, що «це вже все». Ніхто не знає.',
    options: [
      {
        id: 'check',
        text: 'Висунутися й перевірити',
        requires: { skillAtLeast: { survival: 1 } },
        effects: { stats: { health: -1, understanding: 2, energy: -1 }, flags: { checked_out: true } },
      },
      {
        id: 'wait',
        text: 'Чекати наказ',
        effects: { stats: { energy: -1, trust: 1 } },
      },
      {
        id: 'talk_down',
        text: 'Заспокоїти тих, хто хоче бігти',
        effects: { stats: { bonds: 2, understanding: 1, energy: -1 } },
      },
    ],
  },
  {
    id: 'phase5.wind',
    kind: 'event',
    phase: [5],
    text: 'Вітер змінюється. Усі піднімають голови. Ти раптом думаєш про кухню вдома й про те, що там тепер ніхто не сидить.',
    options: [
      {
        id: 'remember',
        text: 'Згадати все, що було вдома',
        effects: { stats: { bonds: 2, understanding: 2, energy: -1 } },
      },
      {
        id: 'pray',
        text: 'Молитися, хоч і не віриш',
        effects: { stats: { energy: 1, understanding: -1, trust: 1 } },
      },
      {
        id: 'prepare',
        text: 'Приготуватися',
        effects: { stats: { health: 1, energy: -1 }, skills: { survival: 1 } },
      },
    ],
  },
  {
    id: 'phase4.gossip',
    kind: 'person',
    phase: [4, 5],
    text: 'Тиловий писар розповідає, що «нагорі» вже все вирішено й нас залишили як приманку. Він каже це з гордістю.',
    options: [
      {
        id: 'believe',
        text: 'Повірити й розповісти хлопцям',
        effects: { stats: { understanding: 2, bonds: -1, trust: -1 }, flags: { told_bait: true } },
      },
      {
        id: 'dismiss',
        text: 'Відмахнутися',
        effects: { stats: { understanding: -1, energy: 1 } },
      },
      {
        id: 'check',
        text: 'Перевірити через знайомого в штабі',
        requires: { skillAtLeast: { system: 2 } },
        effects: { stats: { understanding: 2, supplies: -1 }, flags: { knows_bait: true } },
      },
    ],
  },
  {
    id: 'phase3.photo',
    kind: 'routine',
    phase: [3, 4],
    text: 'Хтось приніс фотоапарат. Хлопці хочуть фото «на пам’ять». Ти думаєш, кому це фото потім показувати.',
    options: [
      {
        id: 'pose',
        text: 'Позувати разом з усіма',
        effects: { stats: { bonds: 2, energy: 1 } },
      },
      {
        id: 'refuse',
        text: 'Відмовитись',
        effects: { stats: { understanding: 1, bonds: -1 } },
      },
      {
        id: 'send',
        text: 'Попросити, щоб надіслали мамі',
        effects: { stats: { bonds: 1, understanding: 1 }, flags: { photo_to_mom: true } },
      },
    ],
  },
  {
    id: 'phase2.hazing',
    kind: 'system',
    phase: [2],
    text: '«Дідівщина» в новому вигляді: новачкам — прибирати, старшим — нічого. Один із сержантів називає це «традиціями».',
    options: [
      {
        id: 'obey',
        text: 'Прибирати без слів',
        effects: { stats: { trust: 1, energy: -2 } },
      },
      {
        id: 'stand',
        text: 'Сказати, що це не традиція, а безлад',
        effects: { stats: { trust: -2, bonds: 2, understanding: 1 } },
      },
      {
        id: 'trade',
        text: 'Домовитись: прибираю, але за харчі',
        requires: { skillAtLeast: { people: 1 } },
        effects: { stats: { supplies: 2, trust: -1, bonds: 1 }, skills: { people: 1 } },
      },
    ],
  },
  {
    id: 'phase4.quiet_evening',
    kind: 'routine',
    phase: [4, 5],
    text: 'Тихий вечір. Хтось дістає гітару й грає пісню, яку всі знають, але не пам’ятають, звідки.',
    options: [
      {
        id: 'sing',
        text: 'Підспівувати',
        effects: { stats: { bonds: 2, energy: 1, understanding: 1 } },
      },
      {
        id: 'listen',
        text: 'Слухати й дивитися на обличчя',
        effects: { stats: { understanding: 2, energy: 1 } },
      },
      {
        id: 'ask',
        text: 'Запитати хлопця, де він це чув',
        effects: { stats: { bonds: 1, understanding: 1 }, flags: { song_story: true } },
      },
    ],
  },
  {
    id: 'phase5.final_wait',
    kind: 'final',
    phase: [5],
    text: 'День, який не мав настати. Позиція тримається, але пил у повітрі вже не пил.',
    options: [
      {
        id: 'ready',
        text: 'Приготуватися й дивитися прямо',
        effects: { stats: { understanding: 1, bonds: 1 } },
      },
      {
        id: 'hide',
        text: 'Залягти на дно окопу',
        effects: { stats: { health: -1, energy: -1 } },
      },
      {
        id: 'comfort',
        text: 'Прикрити хлопця поруч',
        effects: { stats: { bonds: 2, health: -2 } },
      },
    ],
  },
];

export const TEST_ENDINGS: Ending[] = [
  {
    id: 'ending.morkva',
    kind: 'accident',
    title: 'За банку моркви',
    epilogue:
      'Він загинув за банку тушкованої моркви, яку приніс із собою в окоп. У зведенні цього не буде. У селі — теж.',
    defaultEpitaph: 'Носив із собою моркву. Не доніс.',
    weight: 1,
  },
  {
    id: 'ending.tihiy',
    kind: 'system',
    title: 'Тихий запас',
    epilogue:
      'Його «списали» за розкладеним графіком. Документи в порядку, дата в наказі — точна. Ніхто не помітив, коли саме все скінчилося.',
    defaultEpitaph: 'Списали за графіком. Без коментарів.',
    weight: 2,
    requires: { statAtMost: { understanding: 4 } },
  },
  {
    id: 'ending.poruch',
    kind: 'accident',
    title: 'Поруч із тим, хто вижив',
    epilogue:
      'Його винесли з позиції, яку ніхто не мав тримати. Той, хто вижив, не знав його прізвища, але запам’ятав його спальник.',
    defaultEpitaph: 'Віддав спальник. Більше не змерз.',
    weight: 2,
    requires: { statAtLeast: { bonds: 6 } },
  },
  {
    id: 'ending.dobra',
    kind: 'sacrifice',
    title: 'Добра пам’ять',
    epilogue:
      'Про нього згадують у відділенні без пафосу: «Він рахував блокпости й питав дурні питання». Це — найкраще, що тут можна отримати.',
    defaultEpitaph: 'Питав дурні питання. Ніхто не смів відповісти.',
    weight: 1,
    requires: { statAtLeast: { understanding: 6, bonds: 6 } },
  },
  {
    id: 'ending.kryk',
    kind: 'sacrifice',
    title: 'Потайний крик',
    epilogue:
      'Він устиг сказати вголос те, що всі думали вночі. Це нічого не змінило. Це змінило трьох людей у бліндажі.',
    defaultEpitaph: 'Сказав це вголос. Один раз.',
    weight: 1,
    requires: { flagTrue: ['doubt_shared', 'honest_epitaph'] },
  },
  {
    id: 'ending.hardend',
    kind: 'system',
    title: 'Неліпа випадковість',
    epilogue:
      'Офіційно — влучання. Неофіційно — ніхто вже не пам’ятає, навіщо це місце тримали. Список довгий, прізвища дрібним шрифтом.',
    defaultEpitaph: 'Тримали місце, яке нікому не потрібне.',
    weight: 3,
  },
  {
    id: 'ending.wounds',
    kind: 'accident',
    title: 'Своїми ногами, не своєю волею',
    epilogue:
      'Він зробив усе правильно — і все одно не встиг. Рана виявилась швидшою за будь-яку навичку.',
    defaultEpitaph: 'Все правильно. Все одно не встиг.',
    weight: 2,
    requires: { statAtLeast: { understanding: 3 } },
  },
  {
    id: 'ending.letters',
    kind: 'quiet',
    title: 'Потім напишеш',
    epilogue:
      'Він писав листи, які не доходили. Одного листа таки прочитали — через рік, в іншому місті, чужі люди.',
    defaultEpitaph: 'Писав листи. Один дійшов.',
    weight: 1,
    requires: { flagTrue: ['letters_help'] },
  },
];