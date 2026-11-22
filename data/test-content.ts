// Контент MVP: 84 картки, 8 фіналів.
// Тон: чорна іронія без пафосу; вигадані люди й частини; без рахунку вбитих.
// Структура за ТЗ: 5 фаз, показники 0..10, навички 0..3, прапорці для наскрізних ліній.

import type { Card, Ending } from '../src/types.ts';

export const TEST_CARDS: Card[] = [
  // ─────────────────────────── ФАЗА 1: дім, повістка, військкомат ───────────────────────────
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
    follows: ['call.paper'],
    lead: 'Ти вже в черзі — повістка в кишені.',
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
    follows: ['call.queue', 'call.queue_old'],
    lead: 'Чергу пройдено, тепер кабінет із бланком.',
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
    id: 'call.bag',
    follows: ['call.paper', 'call.farewell'],
    lead: 'Вдома, за день до від\'їзду.',
    kind: 'routine',
    phase: [1],
    text: 'Збираєш сумку. Мама мовчки кладе туди зайву пару шкарпеток і шоколадку. Ти знаєш, що шоколадку тобі не дадуть донести.',
    options: [
      { id: 'take', text: 'Взяти все й не сперечатися', effects: { stats: { supplies: 2, bonds: 1, energy: -1 } } },
      {
        id: 'leave_sweet',
        text: 'Лишити шоколадку їй — на чай',
        effects: { stats: { bonds: 2, supplies: -1 }, flags: { left_sweet: true } },
      },
      {
        id: 'pack_smart',
        text: 'Перепакувати сам: ліки, шнурки, сіль',
        requires: { skillAtLeast: { survival: 1 } },
        effects: { stats: { supplies: 3, energy: -1 }, skills: { survival: 1 } },
      },
    ],
  },
  {
    id: 'call.busstop',
    follows: ['call.paper'],
    lead: 'Двір, знайомі обличчя, чужі поради.',
    kind: 'person',
    phase: [1],
    once: true,
    character: 'Сусід дядько Гриша',
    text: 'Дядько Гриша з третього поверху виходить на балкон і каже вниз те, що казав усім: «Я в Афгані був. Нічого не бійся, головне — не висовуйся».',
    options: [
      { id: 'listen', text: 'Слухати й кивати', effects: { stats: { understanding: 1, energy: 1 } } },
      {
        id: 'ask_what',
        text: 'Запитати, що він має на увазі',
        effects: { stats: { understanding: 2, bonds: 1 }, skills: { survival: 1 } },
      },
      {
        id: 'walk',
        text: 'Піти, не дослухавши',
        effects: { stats: { energy: 1, trust: -1 } },
      },
    ],
  },
  {
    // Відкривається в наступних фазах, якщо пробував піти з черги.
    id: 'call.tried_to_leave_after',
    follows: ['call.queue', 'call.street'],
    lead: 'Наслідок того, що ти колись вагався.',
    kind: 'system',
    phase: [3, 4],
    once: true,
    requires: { flagTrue: ['tried_to_leave'] },
    text: 'У документах хтось дописав примітку: «схильний до ухилення». Ти бачиш це випадково, коли підписують відпустку — тобі відмовляють.',
    options: [
      {
        id: 'prove',
        text: 'Доводити, що це давно й не так',
        effects: { stats: { trust: -1, energy: -2, understanding: 1 }, flags: { proved_himself: true } },
      },
      {
        id: 'swallow',
        text: 'Проковтнути й піти',
        effects: { stats: { understanding: 2, bonds: 1, trust: 1 } },
      },
      {
        id: 'find_who',
        text: 'Спитати, хто саме це написав',
        requires: { skillAtLeast: { system: 1 } },
        effects: { stats: { understanding: 2, supplies: -1 }, flags: { knows_pisets: true } },
      },
    ],
  },
  {
    id: 'call.farewell',
    follows: ['call.bag'],
    lead: 'Останній вечір удома.',
    kind: 'event',
    phase: [1],
    once: true,
    text: 'Вечір перед від\'їздом. Мама вийшла на кухню й там стоїть. Ти чуєш, як вода з крана тече надто довго.',
    options: [
      { id: 'go', text: 'Піти на кухню й обійняти', effects: { stats: { bonds: 3, energy: -1 } } },
      {
        id: 'call_sister',
        text: 'Зателефонувати сестрі, яка не приїхала',
        effects: { stats: { bonds: 1, understanding: 1 } },
      },
      {
        id: 'not_say',
        text: 'Нічого не казати — так легше',
        effects: { stats: { bonds: -2, energy: 1, understanding: -1 } },
      },
    ],
  },
  {
    id: 'call.queue_old',
    follows: ['call.paper'],
    lead: 'Той самий ранок, та сама черга.',
    kind: 'person',
    phase: [1],
    text: 'Перед тобою в черзі стоїть чоловік років п\'ятдесяти й тримає повістку двома руками, ніби вона може вирватись.',
    options: [
      {
        id: 'ask_years',
        text: 'Запитати, чи він уже служив',
        effects: { stats: { understanding: 2, bonds: 1 } },
      },
      {
        id: 'silence',
        text: 'Нічого не питати',
        effects: { stats: { energy: 1 } },
      },
      {
        id: 'swap_place',
        text: 'Пропустити його вперед',
        effects: { stats: { bonds: 2, energy: -1 } },
      },
    ],
  },
  {
    id: 'call.street',
    follows: ['call.paper', 'call.bag'],
    lead: 'Дорога, яка вже не веде додому.',
    kind: 'event',
    phase: [1],
    text: 'Дорогою до військкомату повз проходять двоє з пакетами. Один каже другому: «Не наша війна». Той киває. Ніхто не дивиться на тебе.',
    options: [
      {
        id: 'agree',
        text: 'Подумати, що він має рацію',
        effects: { stats: { understanding: 2, trust: -1, energy: -1 } },
      },
      {
        id: 'angry',
        text: 'Сказати щось у відповідь',
        effects: { stats: { energy: -2, bonds: -1, trust: 1 } },
      },
      {
        id: 'ignore',
        text: 'Зробити вигляд, що не чув',
        effects: { stats: { energy: 1 } },
      },
    ],
  },
  {
    id: 'call.toilet',
    follows: ['call.medical'],
    lead: 'Перший день у частині.',
    kind: 'routine',
    phase: [1],
    text: 'Туалет у військкоматі не має дверей. Інструктор каже: «Привикайте». Перші три дні це здається найбільшою проблемою.',
    options: [
      { id: 'joke', text: 'Жартувати з цього', effects: { stats: { bonds: 2, energy: -1 } } },
      {
        id: 'fix',
        text: 'Знайти шматок брезенту й повісити',
        requires: { skillAtLeast: { survival: 1 } },
        effects: { stats: { bonds: 2, supplies: -1, trust: -1 }, flags: { fixed_toilet: true } },
      },
      {
        id: 'endure',
        text: 'Стиснути зуби й терпіти',
        effects: { stats: { energy: -1, trust: 1 } },
      },
    ],
  },

  // ─────────────────────────── ФАЗА 2: навчання, перший колектив ───────────────────────────
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
        text: 'Роздати те, що взяв із дому',
        effects: { stats: { bonds: 3, supplies: -2 } },
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
    follows: ['phase2.bus', 'phase2.hole'],
    lead: 'Хтось, хто вже знає, як тут живуть.',
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
    follows: ['phase2.bus'],
    lead: 'Перший обід у полі.',
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
    follows: ['call.farewell', 'phase2.bus'],
    lead: 'Дзвінок, якого чекав і боявся.',
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
    follows: ['phase2.bus'],
    lead: 'Шикування, де тебе вперше ділять.',
    kind: 'system',
    phase: [2, 3],
    once: true,
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
        id: 'ask',
        text: 'Запитати, за яким принципом обирають',
        requires: { skillAtLeast: { system: 1 } },
        effects: { stats: { understanding: 2, trust: -1 }, flags: { knows_selection: true } },
      },
    ],
  },
  {
    id: 'phase2.commander_orders',
    follows: ['phase2.split', 'phase2.hazing'],
    lead: 'Порядок, який ніхто не питав, чи потрібен.',
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
    id: 'phase2.hazing',
    follows: ['phase2.bus'],
    lead: 'Перші дні в чужому колективі.',
    kind: 'system',
    phase: [2],
    once: true,
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
    id: 'phase2.weapon',
    follows: ['phase2.bus', 'phase2.split'],
    lead: 'Тепер ти не просто новобранець.',
    kind: 'routine',
    phase: [2],
    text: 'Тобі видають автомат. Він старий, важкий і, здається, пам\'ятає більше, ніж ти. Сержант каже: «Це твій найкращий друг».',
    options: [
      {
        id: 'clean',
        text: 'Розібрати, почистити, зібрати',
        effects: { skills: { drill: 1, survival: 1 }, stats: { energy: -1, health: -1 } },
      },
      {
        id: 'name',
        text: 'Дати йому ім\'я, щоб не боятися',
        effects: { stats: { energy: 1, bonds: 1, understanding: -1 } },
      },
      {
        id: 'ask_clean',
        text: 'Попросити сержанта показати, як правильно',
        requires: { skillAtLeast: { people: 1 } },
        effects: { skills: { drill: 1 }, stats: { trust: 1, energy: -1 }, flags: { knows_weapon: true } },
      },
    ],
  },
  {
    id: 'phase2.hole',
    follows: ['phase2.bus'],
    lead: 'Перша ніч поза казармою.',
    kind: 'event',
    phase: [2],
    text: 'Перша ніч у полі. Ти риєш «окоп» і розумієш, що це просто яма. Лопата коротка, земля — як камінь.',
    options: [
      { id: 'dig', text: 'Копати до світанку', effects: { stats: { energy: -3, health: -1 }, skills: { survival: 1 } } },
      {
        id: 'mask',
        text: 'Закопати трохи й замаскувати',
        effects: { stats: { energy: -1, supplies: -1, understanding: 1 } },
      },
      {
        id: 'help',
        text: 'Копати разом із сусідом — повільніше, але вдвох',
        effects: { stats: { bonds: 2, energy: -2 } },
      },
    ],
  },
  {
    id: 'phase2.test_song',
    follows: ['phase2.bus', 'phase2.commander_orders'],
    lead: 'Перевірка на «своїх».',
    kind: 'event',
    phase: [2],
    text: 'Політрук питає, хто знає другий куплет. Усі дивляться в землю. Ти знаєш, але розумієш, що скажеш.',
    options: [
      { id: 'sing', text: 'Заспівати', effects: { stats: { trust: 2, bonds: -1, energy: -1 } } },
      {
        id: 'mumble',
        text: 'Пробубоніти щось схоже',
        effects: { stats: { trust: 1, understanding: -1 } },
      },
      {
        id: 'silent',
        text: 'Мовчати, як усі',
        effects: { stats: { bonds: 2, trust: -1 } },
      },
    ],
  },
  {
    id: 'phase2.letters_home',
    follows: ['phase2.phone', 'call.farewell'],
    lead: 'Усі пишуть додому, ніхто не знає що.',
    kind: 'routine',
    phase: [2, 3],
    text: 'Хлопці пишуть листи додому. Один питає, що писати, якщо насправді нічого доброго немає.',
    options: [
      {
        id: 'teach',
        text: 'Показати, як писати про дрібне',
        effects: { stats: { bonds: 2, understanding: 1, energy: -1 }, flags: { taught_letters: true } },
      },
      { id: 'honest', text: '«Пиши як є»', effects: { stats: { understanding: 2, bonds: -1 } } },
      {
        id: 'dont',
        text: 'Сказати, що це не твоя справа',
        effects: { stats: { energy: 1, bonds: -1 } },
      },
    ],
  },
  {
    id: 'phase2.socks',
    follows: ['phase2.bus', 'phase2.hole'],
    lead: 'Побут, який не закінчується.',
    kind: 'routine',
    phase: [2, 3],
    text: 'Прання. Сусід по намету миє шкарпетки в каску. Ти бачиш це й розумієш, що тепер каска — це назавжди два предмети.',
    options: [
      {
        id: 'laugh',
        text: 'Посміятися й повторити те саме',
        effects: { stats: { bonds: 2, energy: 1, health: -1 } },
      },
      {
        id: 'protocol',
        text: 'Придумати, як прати нормально',
        requires: { skillAtLeast: { survival: 1 } },
        effects: { stats: { health: 1, supplies: -1, bonds: 1 }, flags: { knows_laundry: true } },
      },
      {
        id: 'ignore',
        text: 'Не звертати уваги',
        effects: { stats: { health: -1, energy: 1 } },
      },
    ],
  },
  {
    id: 'phase2.first_fire',
    follows: ['phase2.hole', 'phase2.weapon'],
    lead: 'Те, до чого готували, починається.',
    kind: 'event',
    phase: [2, 3],
    once: true,
    text: 'Перший обстріл. Усі лежать. Хтось читає молитву, яку не знає. Ти раптом рахуєш секунди між розривами.',
    options: [
      {
        id: 'count',
        text: 'Рахувати й запам\'ятовувати',
        effects: { stats: { understanding: 2, energy: -2 }, skills: { survival: 1 }, flags: { counted_fire: true } },
      },
      {
        id: 'calm',
        text: 'Заспокоїти хлопця поруч',
        effects: { stats: { bonds: 2, health: -1, energy: -1 } },
      },
      {
        id: 'freeze',
        text: 'Завмерти й не рухатись',
        effects: { stats: { energy: -3, health: -1 } },
      },
    ],
  },

  // ─────────────────────────── ФАЗА 3: окоп, вода, втрати ───────────────────────────
  {
    id: 'phase3.trench',
    kind: 'event',
    phase: [3],
    text: 'Твій окоп заливає вода. Сусідній — теж. Ніхто не пропонує допомогти, але всі дивляться.',
    options: [
      {
        id: 'share_spot',
        text: 'Пустити сусіда на свою суху половину',
        effects: { stats: { bonds: 2, health: -1, energy: -1 }, flags: { shared_trench: true } },
      },
      {
        id: 'keep',
        text: 'Залишити собі сухе',
        effects: { stats: { health: 1, bonds: -1, trust: -1 } },
      },
      {
        id: 'drain',
        text: 'Разом прокопати водовідвід',
        requires: { skillAtLeast: { survival: 1 } },
        effects: { stats: { bonds: 2, health: 1, energy: -2 }, skills: { survival: 1 } },
      },
    ],
  },
  {
    id: 'phase3.water',
    follows: ['phase3.trench'],
    lead: 'Окоп залило, тепер закінчується вода.',
    kind: 'routine',
    phase: [3, 4],
    text: 'Вода в каністрі закінчується. Останній ковток — і треба йти через відкриту ділянку до колодязя.',
    options: [
      {
        id: 'drink',
        text: 'Випити відразу',
        effects: { stats: { health: 1, energy: 1, supplies: -1 } },
      },
      {
        id: 'boil',
        text: 'Назбирати з калюжі й прокип\'ятити',
        requires: { skillAtLeast: { survival: 1 } },
        effects: { stats: { supplies: 2, health: -1, energy: -2 }, skills: { survival: 1 } },
      },
      {
        id: 'warn',
        text: 'Сказати хлопцям, що води мало',
        effects: { stats: { bonds: 2, energy: 1 } },
      },
    ],
  },
  {
    id: 'phase3.loss',
    follows: ['phase2.first_fire'],
    lead: 'Після першого бою завжди когось немає.',
    kind: 'event',
    phase: [3, 4],
    once: true,
    text: 'Уранці хлопця з сусіднього відділення немає. Ніхто не знає, що казати. Хтось каже: «Я його бачив увечері». Ще хтось: «Я теж».',
    options: [
      {
        id: 'say',
        text: 'Сказати вголос, що він загинув',
        effects: { stats: { understanding: 2, bonds: 1, energy: -2 }, flags: { said_he_died: true } },
      },
      {
        id: 'silent',
        text: 'Мовчати разом з усіма',
        effects: { stats: { trust: 1, understanding: -1, bonds: 1 } },
      },
      {
        id: 'letter',
        text: 'Почати писати лист його мамі',
        effects: { stats: { bonds: 3, energy: -2 }, flags: { will_write_letter: true } },
      },
    ],
  },
  {
    // Відкривається в наступних фазах, якщо почав писати.
    id: 'phase3.letter_followup',
    follows: ['phase3.loss'],
    lead: 'Лист, який ти почав писати.',
    kind: 'event',
    phase: [4, 5],
    once: true,
    requires: { flagTrue: ['will_write_letter'] },
    text: 'Той лист досі не дописаний. Він лежить у нагрудній кишені й пахне твоїм потом, а не чужим життям.',
    options: [
      {
        id: 'finish',
        text: 'Дописати й віддати',
        effects: { stats: { bonds: 2, understanding: 2, energy: -1 }, flags: { letter_sent: true }, journal: 'Дописав лист.' },
      },
      {
        id: 'burn',
        text: 'Спалити',
        effects: { stats: { understanding: 1, bonds: -2, health: -1 } },
      },
      {
        id: 'keep',
        text: 'Носити далі, поки що є коли',
        effects: { stats: { energy: -1, understanding: 1 } },
      },
    ],
  },
  {
    id: 'phase3.propaganda',
    follows: ['phase2.commander_orders', 'phase2.test_song'],
    lead: 'Ті, хто хоче показати, що все гаразд.',
    kind: 'system',
    phase: [3, 4],
    text: 'Приїжджає «преса». Просить сфотографуватися з усмішкою. Хтось усміхається. Ти думаєш, кому потім покажуть це фото.',
    options: [
      {
        id: 'believe',
        text: 'Сказати, що це добре для морального духу',
        effects: { stats: { trust: 2, understanding: -2 } },
      },
      {
        id: 'count',
        text: 'Порахувати, скільки людей на фото',
        effects: { stats: { understanding: 2, energy: -1 }, flags: { counted_photo: true } },
      },
      {
        id: 'turn_off',
        text: 'Відвернутися в момент зйомки',
        effects: { stats: { trust: -2, bonds: 2, understanding: 1 } },
      },
    ],
  },
  {
    id: 'phase3.medic',
    follows: ['phase2.sapper'],
    lead: 'Людина, яка вчить не вмирати.',
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
    follows: ['phase2.first_fire', 'phase3.water'],
    lead: 'Тіло здається раніше за людину.',
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
    follows: ['phase2.split', 'phase3.trench'],
    lead: 'Той, хто продає вихід із цього.',
    kind: 'system',
    phase: [3, 4],
    once: true,
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
    id: 'phase3.food_ration',
    follows: ['phase2.soup'],
    lead: 'Хтось таки пам\'ятає про вас.',
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
    id: 'phase3.coward',
    follows: ['phase2.commander_orders', 'phase2.hazing'],
    lead: 'Тебе помітили — але не з доброго боку.',
    kind: 'system',
    phase: [3, 4],
    text: 'Командир відділення пропонує тобі стати його «очима»: доносити, хто що каже про накази. Обіцяє «прикриття».',
    options: [
      {
        id: 'agree',
        text: 'Погодитись — це прикриття',
        effects: { stats: { trust: 3, bonds: -3, understanding: -2 }, flags: { informer: true } },
      },
      {
        id: 'refuse',
        text: 'Відмовитись прямо',
        effects: { stats: { trust: -2, bonds: 2, understanding: 1 } },
      },
      {
        id: 'pretend',
        text: 'Погодитись і не робити нічого',
        requires: { skillAtLeast: { system: 1 } },
        effects: { stats: { trust: -1, understanding: 2, energy: -1 }, flags: { fake_informer: true } },
      },
    ],
  },
  {
    // Прапорець informer має наслідки.
    id: 'phase4.informer_after',
    follows: ['phase3.coward'],
    lead: 'Те, що ти пообіцяв робити.',
    kind: 'event',
    phase: [4, 5],
    once: true,
    requires: { flagTrue: ['informer'] },
    text: 'Хлопці перестали говорити при тобі. Помітив не відразу. Хтось перестав сідати поруч — теж не відразу.',
    options: [
      {
        id: 'admit',
        text: 'Сказати, що почав це й шкодує',
        effects: { stats: { bonds: 2, trust: -2, understanding: 2, energy: -1 } },
      },
      {
        id: 'double',
        text: 'Доносити ще, щоб уже не було чого втрачати',
        effects: { stats: { trust: 2, bonds: -3, understanding: -2 } },
      },
      {
        id: 'silent',
        text: 'Жити з цим мовчки',
        effects: { stats: { energy: -2, bonds: -1, understanding: 1 } },
      },
    ],
  },
  {
    id: 'phase3.photo',
    follows: ['phase2.letters_home'],
    lead: 'Хочеться лишити слід.',
    kind: 'routine',
    phase: [3, 4],
    text: 'Хтось приніс фотоапарат. Хлопці хочуть фото «на пам\'ять». Ти думаєш, кому це фото потім показувати.',
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
    id: 'phase3.rot',
    follows: ['phase3.trench', 'phase2.socks'],
    lead: 'Вода й холод беруть своє.',
    kind: 'event',
    phase: [3, 4],
    text: 'Взуття розмокло й уже не сохне. Ноги в кволі. Медсестра каже: «Поки не чорні — все добре».',
    options: [
      {
        id: 'dry',
        text: 'Висушити бодай шкарпетки над буржуйкою',
        effects: { stats: { health: 1, energy: -1, supplies: -1 } },
      },
      {
        id: 'swap',
        text: 'Попросити в когось запасні',
        effects: { stats: { health: 2, bonds: -1, supplies: -1 } },
      },
      {
        id: 'endure',
        text: 'Терпіти',
        effects: { stats: { health: -2, energy: -1, trust: 1 } },
      },
    ],
  },
  {
    id: 'phase3.drill_hard',
    follows: ['phase2.commander_orders'],
    lead: 'Їхній «порядок» знову на твоєму сні.',
    kind: 'system',
    phase: [3],
    text: 'Раптовий «навчальний підйом» о третій ночі. Хтось засинає стоячи. Сержант кричить, що «це і є перевірка».',
    options: [
      {
        id: 'stand',
        text: 'Стояти й відпрацьовувати',
        effects: { skills: { drill: 1 }, stats: { energy: -3, trust: 1 } },
      },
      {
        id: 'tell',
        text: 'Сказати сержантові, що це шкодить',
        effects: { stats: { trust: -2, bonds: 1, understanding: 1 } },
      },
      {
        id: 'fake',
        text: 'Зробити вигляд, що виконуєш',
        requires: { skillAtLeast: { system: 1 } },
        effects: { stats: { trust: 1, understanding: 1, energy: -1 }, flags: { learnt_fake: true } },
      },
    ],
  },
  {
    id: 'phase3.medicine',
    follows: ['phase3.medic'],
    lead: 'Оля знову рахує те, чого не вистачає.',
    kind: 'routine',
    phase: [3, 4],
    text: 'У медпункті лишилось три пігулки від болю. Оля каже: «Реальних претендентів — шестеро».',
    options: [
      {
        id: 'own',
        text: 'Взяти собі одну — у тебе ниє коліно',
        effects: { stats: { health: 2, bonds: -2 } },
      },
      {
        id: 'give',
        text: 'Віддати тому, кому гірше',
        effects: { stats: { bonds: 3, energy: -1 } },
      },
      {
        id: 'ask_olia',
        text: 'Спитати Олю, кому справді потрібно',
        requires: { skillAtLeast: { people: 1 } },
        effects: { stats: { understanding: 2, bonds: 2, health: -1 }, flags: { knows_triage: true } },
      },
    ],
  },

  // ─────────────────────────── ФАЗА 4: холод, сумніви, люди ───────────────────────────
  {
    id: 'phase4.cold',
    follows: ['phase3.rot'],
    lead: 'Холод, який уже не відступає.',
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
    follows: ['phase3.loss', 'phase2.letters_home'],
    lead: 'Листи стають важливішими.',
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
    follows: ['phase3.propaganda', 'phase4.gossip'],
    lead: 'Те, що ти почув, не сходиться.',
    kind: 'event',
    phase: [4, 5],
    once: true,
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
    follows: ['phase3.coward', 'phase3.bribe'],
    lead: 'Той, хто теж не вірить у пафос.',
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
    follows: ['phase4.doubt'],
    lead: 'Думка стала дією — але не твоєю.',
    kind: 'event',
    phase: [4, 5],
    once: true,
    text: 'Двоє з відділення пішли вночі. Уранці це називають «зрадою». Ти сам думав про це дев\'ять ночей.',
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
    id: 'phase4.gossip',
    follows: ['phase3.propaganda'],
    lead: 'Хтось знає більше й каже це вголос.',
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
    id: 'phase4.wound',
    follows: ['phase2.first_fire', 'phase3.break'],
    lead: 'Війна знаходить тебе прямо.',
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
    id: 'phase4.quiet_evening',
    follows: ['phase3.loss', 'phase4.letters'],
    lead: 'Вечір без обстрілу — теж частина війни.',
    kind: 'routine',
    phase: [4, 5],
    text: 'Тихий вечір. Хтось дістає гітару й грає пісню, яку всі знають, але не пам\'ятають, звідки.',
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
    id: 'phase4.home_news',
    follows: ['phase2.phone', 'phase4.letters'],
    lead: 'Вдома теж іде своя війна.',
    kind: 'event',
    phase: [4, 5],
    once: true,
    text: 'Сестра пише, що в місті закрили школу й перевели її клас у підвал. Просить «не переживати».',
    options: [
      {
        id: 'reply',
        text: 'Відповісти зараз, поки є зв\'язок',
        effects: { stats: { bonds: 3, energy: -2 } },
      },
      {
        id: 'later',
        text: 'Відкласти — зараз не до цього',
        effects: { stats: { energy: 1, bonds: -2, understanding: -1 } },
      },
      {
        id: 'send_money',
        text: 'Спробувати передати трохи грошей',
        requires: { statAtLeast: { supplies: 3 } },
        effects: { stats: { supplies: -3, bonds: 3, trust: -1 } },
      },
    ],
  },
  {
    id: 'phase4.replacement',
    follows: ['phase2.hazing', 'phase4.standing'],
    lead: 'Ти вже не наймолодший.',
    kind: 'person',
    phase: [4, 5],
    text: 'Прийшов «молодий» — двадцять років і впевненість, що він знає все. Дивиться на тебе, як на старика.',
    options: [
      {
        id: 'teach',
        text: 'Навчити того, що знаєш',
        effects: { skills: { people: 1 }, stats: { bonds: 2, understanding: 1, energy: -1 } },
      },
      {
        id: 'warn',
        text: 'Попередити, що тут ніхто не знає всього',
        effects: { stats: { understanding: 2, bonds: 1 } },
      },
      {
        id: 'mock',
        text: 'Посміятися з його впевненості',
        effects: { stats: { bonds: -2, energy: 1 } },
      },
    ],
  },
  {
    id: 'phase4.night_watch',
    follows: ['phase3.trench'],
    lead: 'Ніч, яка не хоче закінчуватись.',
    kind: 'routine',
    phase: [4, 5],
    text: 'Твоя зміна на спостереженні. Мінус десять, ніч, тиша. Хочеться спати так, що боляче.',
    options: [
      {
        id: 'stay_awake',
        text: 'Стояти до кінця, хоч би що',
        effects: { stats: { health: -2, energy: -2, trust: 2 }, flags: { held_watch: true } },
      },
      {
        id: 'micro_sleep',
        text: 'Дрімнути хвилин на десять',
        effects: { stats: { energy: 2, trust: -1, health: -1 } },
      },
      {
        id: 'share',
        text: 'Домовитись із сусідом по черзі',
        requires: { skillAtLeast: { people: 1 } },
        effects: { stats: { bonds: 2, energy: 1, trust: -1 } },
      },
    ],
  },
  {
    id: 'phase4.rumours',
    follows: ['phase4.gossip'],
    lead: 'Новини гірші за тишу.',
    kind: 'system',
    phase: [4, 5],
    text: 'Ходять чутки, що скоро «все закінчиться». Одні кажуть — добре, інші — що тоді нас точно не заберуть.',
    options: [
      {
        id: 'hope',
        text: 'Вірити в хороший варіант',
        effects: { stats: { energy: 2, understanding: -1, trust: 1 } },
      },
      {
        id: 'realistic',
        text: 'Сказати хлопцям, що обидва варіанти погані по-своєму',
        effects: { stats: { understanding: 2, bonds: 1, energy: -1 } },
      },
      {
        id: 'silence',
        text: 'Не втручатись',
        effects: { stats: { energy: 1 } },
      },
    ],
  },
  {
    id: 'phase4.stolen',
    follows: ['phase3.food_ration'],
    lead: 'Голод робить людей простими.',
    kind: 'event',
    phase: [4, 5],
    text: 'У тебе зникли сухарі. Хтось їх узяв. Ти знаєш, хто — він не їв три дні.',
    options: [
      {
        id: 'ask',
        text: 'Поговорити з ним віч-на-віч',
        effects: { stats: { understanding: 2, bonds: 1, supplies: -1 } },
      },
      {
        id: 'public',
        text: 'Сказати при всіх',
        effects: { stats: { bonds: -3, trust: 1, supplies: 1 } },
      },
      {
        id: 'pretend',
        text: 'Зробити вигляд, що не помітив',
        effects: { stats: { bonds: 2, supplies: -1, understanding: 1 } },
      },
    ],
  },
  {
    id: 'phase4.tolko_dies',
    follows: ['phase2.sapper', 'phase3.loss'],
    lead: 'Той, хто вчив тебе жити, не вижив.',
    kind: 'event',
    phase: [4, 5],
    once: true,
    requires: { flagTrue: ['tolko_honest'] },
    text: 'Толіка більше немає. Саме його, того, хто вчив тебе сидіти в окопі. Ти сидиш правильно. І нікого це не врятувало.',
    options: [
      {
        id: 'rage',
        text: 'Сказати вголос, що це безглуздо',
        effects: { stats: { understanding: 3, trust: -3, bonds: 1, energy: -2 } },
      },
      {
        id: 'teach_others',
        text: 'Передати його науку далі',
        effects: { skills: { survival: 1, people: 1 }, stats: { bonds: 2, energy: -1 } },
      },
      {
        id: 'shut',
        text: 'Закритись',
        effects: { stats: { energy: -1, bonds: -2, understanding: 1 } },
      },
    ],
  },

  // ─────────────────────────── ФАЗА 5: тиша, останній пост, вітер ───────────────────────────
  {
    id: 'phase5.lastpost',
    follows: ['phase4.cold', 'phase4.wound', 'phase4.night_watch'],
    lead: 'Наказ, який ніхто не пояснив.',
    kind: 'event',
    phase: [4, 5],
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
    follows: ['phase5.lastpost', 'phase4.desert'],
    lead: 'Розмова, яку всі уникали.',
    kind: 'event',
    phase: [4, 5],
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
    id: 'phase5.silence',
    follows: ['phase5.lastpost'],
    lead: 'Коли стріляють — просто. Коли ні — страшно.',
    kind: 'event',
    phase: [4, 5],
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
    follows: ['phase5.silence'],
    lead: 'Щось змінилось у повітрі.',
    kind: 'event',
    phase: [4, 5],
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
    id: 'phase5.final_wait',
    follows: ['phase5.wind', 'phase5.lastpost'],
    lead: 'Той самий день, якого чекали.',
    kind: 'final',
    phase: [4, 5],
    once: true,
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
  {
    id: 'phase5.last_cigarette',
    follows: ['phase5.lastpost'],
    lead: 'Дрібниця, яка тримає разом.',
    kind: 'routine',
    phase: [4, 5],
    text: 'Остання цигарка на відділення. Її пускають по колу, і кожен робить вигляд, що не хоче.',
    options: [
      {
        id: 'pass',
        text: 'Передати далі, не затягнувшись',
        effects: { stats: { bonds: 2, health: -1 } },
      },
      {
        id: 'puff',
        text: 'Затягнутись раз',
        effects: { stats: { energy: 1, health: -1, bonds: 1 } },
      },
      {
        id: 'talk',
        text: 'Сказати, що це безглуздо, і почати розмову',
        effects: { stats: { understanding: 2, bonds: 1 } },
      },
    ],
  },
  {
    id: 'phase5.promises',
    follows: ['phase5.epitaph'],
    lead: 'Обіцянка, яку не можна виконати.',
    kind: 'person',
    phase: [4, 5],
    text: 'Хлопець просить обіцянку: «Якщо зі мною що — скажи мамі, що я не боявся». Ти знаєш, що це неправда.',
    options: [
      {
        id: 'lie',
        text: 'Обіцяти',
        effects: { stats: { bonds: 2, understanding: -1, energy: 1 } },
      },
      {
        id: 'honest',
        text: 'Сказати, що не можеш обіцяти',
        effects: { stats: { understanding: 2, bonds: -1 } },
      },
      {
        id: 'other',
        text: 'Пообіцяти сказати інше — те, що буде правдою',
        requires: { skillAtLeast: { people: 1 } },
        effects: { stats: { bonds: 3, understanding: 2, energy: -1 }, flags: { true_promise: true } },
      },
    ],
  },
  {
    id: 'phase5.quiet_meal',
    follows: ['phase3.food_ration', 'phase5.lastpost'],
    lead: 'Остання вечеря, як у людей.',
    kind: 'routine',
    phase: [4, 5],
    text: 'Вечеря. Хтось дістає останню банку тушонки й ділить на всіх, включно з тими, хто вже не їсть.',
    options: [
      {
        id: 'eat',
        text: 'З\'їсти свою частину',
        effects: { stats: { health: 1, energy: 1, supplies: -1 } },
      },
      {
        id: 'give',
        text: 'Віддати свою частину',
        effects: { stats: { bonds: 3, health: -1, energy: -1 } },
      },
      {
        id: 'thanks',
        text: 'Подякувати вголос',
        effects: { stats: { bonds: 1, understanding: 2 } },
      },
    ],
  },
  {
    id: 'phase5.last_call',
    follows: ['phase4.home_news', 'phase5.epitaph'],
    lead: 'Зв\'язок, який дали востаннє.',
    kind: 'event',
    phase: [4, 5],
    once: true,
    text: 'Зв\'язок. Кажуть, що «завтра буде важко». Мама в трубці питає, чи ти їв.',
    options: [
      {
        id: 'truth',
        text: 'Сказати правду — може, востаннє',
        effects: { stats: { bonds: 2, understanding: 2, energy: -2 } },
      },
      {
        id: 'lie',
        text: 'Сказати, що все добре',
        effects: { stats: { bonds: 1, understanding: -1, energy: 1 } },
      },
      {
        id: 'silent',
        text: 'Слухати й мовчати',
        effects: { stats: { bonds: 3, energy: -2 } },
      },
    ],
  },
  {
    id: 'phase5.plan_after',
    follows: ['phase5.lastpost', 'phase4.quiet_evening'],
    lead: 'Мрія, яка поки безпечніша за реальність.',
    kind: 'event',
    phase: [4, 5],
    text: 'Хтось починає планувати, що буде після. Ремонт у дворі, рибалка, шашлики. Усі слухають.',
    options: [
      {
        id: 'join',
        text: 'Долучитись до планування',
        effects: { stats: { bonds: 2, energy: 2, understanding: -1 } },
      },
      {
        id: 'honest',
        text: 'Сказати, що не варто',
        effects: { stats: { understanding: 2, bonds: -2, energy: -1 } },
      },
      {
        id: 'listen',
        text: 'Слухати й нічого не казати',
        effects: { stats: { understanding: 1, energy: 1 } },
      },
    ],
  },
  {
    id: 'phase5.broken_radio',
    follows: ['phase5.silence'],
    lead: 'Тиша стала технічною.',
    kind: 'system',
    phase: [4, 5],
    text: 'Рація перестала приймати. Може, села батарея, може — позицію просто виключили зі списків.',
    options: [
      {
        id: 'fix',
        text: 'Спробувати полагодити',
        requires: { skillAtLeast: { system: 1 } },
        effects: { stats: { understanding: 2, energy: -2 }, skills: { system: 1 }, flags: { fixed_radio: true } },
      },
      {
        id: 'assume',
        text: 'Вирішити, що нас виключили',
        effects: { stats: { understanding: 2, bonds: -1, trust: -2 } },
      },
      {
        id: 'not_tell',
        text: 'Не казати хлопцям',
        effects: { stats: { bonds: -1, energy: -1, understanding: -1 } },
      },
    ],
  },
  {
    id: 'phase5.photo_found',
    follows: ['phase3.photo'],
    lead: 'Фото, яке ти хотів надіслати мамі.',
    kind: 'routine',
    phase: [4, 5],
    requires: { flagTrue: ['photo_to_mom'] },
    once: true,
    text: 'У кишені — те фото. Мала, заламінована, з плямою від дощу. Мама його, мабуть, так і не отримала.',
    options: [
      {
        id: 'keep_close',
        text: 'Носити ближче до тіла',
        effects: { stats: { bonds: 2, energy: 1, understanding: 1 } },
      },
      {
        id: 'give',
        text: 'Віддати хлопцеві, який виходить',
        effects: { stats: { bonds: 3, supplies: -1 }, flags: { photo_passed: true } },
      },
      {
        id: 'burn',
        text: 'Спалити, щоб не шкодило',
        effects: { stats: { understanding: 2, bonds: -2 } },
      },
    ],
  },

  // ─────────────────────────── Наскрізні лінії: хто лишився, що з чиєї вини ───────────────────────────
  {
    id: 'line.volunteers_thanks',
    follows: ['phase3.food_ration'],
    lead: 'Ти ж подякував — і от відповідь.',
    kind: 'event',
    phase: [4, 5],
    once: true,
    requires: { flagTrue: ['thanks_volunteers'] },
    text: 'Прийшла відповідь від волонтерів. Дитячим почерком: «Дякуємо, що ви є. Надішліть, будь ласка, імена».',
    options: [
      {
        id: 'names',
        text: 'Написати всі імена, включно з тими, кого вже немає',
        effects: { stats: { bonds: 2, understanding: 2, energy: -1 }, flags: { names_sent: true } },
      },
      {
        id: 'short',
        text: 'Написати тільки своє',
        effects: { stats: { understanding: 1, bonds: -1, energy: 1 } },
      },
      {
        id: 'nothing',
        text: 'Не відповідати',
        effects: {},
      },
    ],
  },
  {
    id: 'line.assault_after',
    follows: ['phase2.split'],
    lead: 'Наслідок того кроку вперед.',
    kind: 'event',
    phase: [4, 5],
    once: true,
    requires: { flagTrue: ['assault'] },
    text: 'Твоя «штурмова» виявилась звичайною піхотою з гучною назвою. Із двадцяти — семеро.',
    options: [
      {
        id: 'count',
        text: 'Порахувати й запам\'ятати',
        effects: { stats: { understanding: 3, energy: -2 }, flags: { knows_seven: true } },
      },
      {
        id: 'tell',
        text: 'Сказати іншим правду про «штурмову»',
        effects: { stats: { trust: -2, bonds: 2, understanding: 1 } },
      },
      {
        id: 'silence',
        text: 'Не згадувати',
        effects: { stats: { energy: 1, understanding: -1 } },
      },
    ],
  },
  {
    id: 'line.fake_informer',
    follows: ['phase3.coward'],
    lead: 'Гра в мовчання закінчилась.',
    kind: 'event',
    phase: [4, 5],
    once: true,
    requires: { flagTrue: ['fake_informer'] },
    text: 'Командир відділення питає, чому від тебе досі «жодної конкретики». Дивиться довго.',
    options: [
      {
        id: 'give',
        text: 'Дати йому щось — будь-що',
        effects: { stats: { trust: 2, bonds: -3, understanding: -1 } },
      },
      {
        id: 'refuse',
        text: 'Сказати, що нічого немає',
        effects: { stats: { trust: -2, bonds: 2, understanding: 1 } },
      },
      {
        id: 'turn',
        text: 'Сказати, що передумав',
        requires: { skillAtLeast: { people: 1 } },
        effects: { stats: { understanding: 2, bonds: 1, trust: -1 }, flags: { informer_out: true } },
      },
    ],
  },
  {
    id: 'line.kept_promise',
    follows: ['phase5.promises'],
    lead: 'Обіцянка, яку ти дав.',
    kind: 'event',
    phase: [5],
    once: true,
    requires: { flagTrue: ['true_promise'] },
    text: 'Той хлопець живий. Дивиться на тебе й чекає, чи ти пам\'ятаєш, що обіцяв. Ти пам\'ятаєш.',
    options: [
      {
        id: 'say',
        text: 'Сказати йому те, що обіцяв',
        effects: { stats: { bonds: 3, understanding: 2, energy: -1 }, flags: { promise_kept: true } },
      },
      {
        id: 'now',
        text: 'Відкласти — не час',
        effects: { stats: { energy: 1, bonds: -2 } },
      },
      {
        id: 'write',
        text: 'Записати, щоб не забути',
        effects: { stats: { understanding: 2, energy: -1 }, flags: { promise_written: true } },
      },
    ],
  },
  {
    id: 'line.known_plan',
    follows: ['phase4.standing'],
    lead: 'План, який ти знаєш.',
    kind: 'event',
    phase: [5],
    once: true,
    requires: { flagTrue: ['knows_plan'] },
    text: 'Ти знаєш план. Він не передбачає, що всі вийдуть. Сказати хлопцям — це вже зрада, мовчати — теж.',
    options: [
      {
        id: 'tell_all',
        text: 'Сказати всім',
        effects: { stats: { understanding: 3, bonds: 2, trust: -3 } },
      },
      {
        id: 'tell_few',
        text: 'Сказати тільки тим, кому довіряєш',
        requires: { skillAtLeast: { people: 1 } },
        effects: { stats: { understanding: 2, bonds: 2, energy: -1 }, flags: { told_withdraw: true } },
      },
      {
        id: 'keep',
        text: 'Носити це сам',
        effects: { stats: { understanding: 2, energy: -3, bonds: -1 } },
      },
    ],
  },
  {
    id: 'line.named_photo',
    follows: ['line.volunteers_thanks'],
    lead: 'Відповідь на твій лист.',
    kind: 'routine',
    phase: [4, 5],
    once: true,
    requires: { flagTrue: ['names_sent'] },
    text: 'Волонтери надіслали фото: наші імена написані на табличці в їхньому штабі. Знайшов своє. І одразу побачив, чиїх немає.',
    options: [
      {
        id: 'look',
        text: 'Дивитися довго',
        effects: { stats: { understanding: 3, bonds: 1, energy: -1 }, flags: { saw_names: true } },
      },
      {
        id: 'pass',
        text: 'Показати хлопцям',
        effects: { stats: { bonds: 3, understanding: 1, energy: -1 } },
      },
      {
        id: 'hide',
        text: 'Сховати',
        effects: { stats: { energy: 1, understanding: -1 } },
      },
    ],
  },

  // ─────────────────────────── Розрядка: людина, а не посада ───────────────────────────
  {
    id: 'misc.dog',
    follows: ['phase2.hole', 'phase3.trench'],
    lead: 'Хтось прийшов, кого не кликали.',
    kind: 'event',
    phase: [3, 4, 5],
    once: true,
    text: 'До позиції приблукав пес. Худий, з обірваним повідком. Ніхто не проганяє. Усі роблять вигляд, що не раді.',
    options: [
      {
        id: 'feed',
        text: 'Віддати йому частину пайки',
        effects: { stats: { bonds: 2, supplies: -2, health: -1 } },
      },
      {
        id: 'name',
        text: 'Дати йому ім\'я',
        effects: { stats: { bonds: 2, energy: 1 } },
      },
      {
        id: 'drive',
        text: 'Прогнати, поки не прив\'язались',
        effects: { stats: { understanding: 1, bonds: -2, energy: 1 } },
      },
    ],
  },
  {
    id: 'misc.dugout',
    follows: ['phase3.trench'],
    lead: 'Порожнеча між боями.',
    kind: 'routine',
    phase: [3, 4],
    text: 'У бліндажі знайшли старі газети 2014 року. Хтось читає вголос, і всі слухають, як казку.',
    options: [
      {
        id: 'listen',
        text: 'Слухати',
        effects: { stats: { understanding: 2, energy: 1 } },
      },
      {
        id: 'joke',
        text: 'Жартувати, що нічого не змінилось',
        effects: { stats: { understanding: 1, bonds: 2, trust: -1 } },
      },
      {
        id: 'compare',
        text: 'Порівняти, що писали тоді й що пишуть зараз',
        effects: { stats: { understanding: 3, energy: -1 }, skills: { system: 1 } },
      },
    ],
  },
  {
    id: 'misc.tea',
    follows: ['phase2.soup'],
    lead: 'Тепло, якого мало.',
    kind: 'routine',
    phase: [2, 3, 4, 5],
    text: 'Хтось заварив чай на буржуйці. У ньому щось плаває. Пахне дитинством.',
    options: [
      {
        id: 'drink',
        text: 'Випити',
        effects: { stats: { energy: 2, bonds: 1 } },
      },
      {
        id: 'share',
        text: 'Налити всім',
        effects: { stats: { bonds: 2, energy: 1, supplies: -1 } },
      },
      {
        id: 'skip',
        text: 'Відмовитись',
        effects: { stats: { health: 1 } },
      },
    ],
  },
  {
    id: 'misc.argue',
    follows: ['phase2.commander_orders', 'phase3.loss'],
    lead: 'Сварка після поганого дня.',
    kind: 'event',
    phase: [3, 4],
    text: 'Двоє сваряться, хто винен, що вчорашній вихід провалився. Кричать так, що чути на сусідній позиції.',
    options: [
      {
        id: 'split',
        text: 'Розборонити',
        effects: { stats: { bonds: 1, energy: -2, understanding: 1 } },
      },
      {
        id: 'truth',
        text: 'Сказати, хто справді винен',
        effects: { stats: { understanding: 2, bonds: -3, trust: 1 } },
      },
      {
        id: 'leave',
        text: 'Піти, поки не втягнули',
        effects: { stats: { energy: 1, bonds: -1 } },
      },
    ],
  },
  {
    id: 'misc.birthday',
    follows: ['misc.tea', 'phase4.quiet_evening'],
    lead: 'День, який мав бути святковим.',
    kind: 'routine',
    phase: [4, 5],
    once: true,
    text: 'У хлопця день народження. Нічим пригостити. Він каже: «Та нічого, я вже дорослий».',
    options: [
      {
        id: 'give',
        text: 'Віддати йому щось своє',
        effects: { stats: { supplies: -2, bonds: 3 } },
      },
      {
        id: 'sing',
        text: 'Заспівати «Многая літа» якомога гірше',
        effects: { stats: { bonds: 2, energy: 1 } },
      },
      {
        id: 'word',
        text: 'Просто сказати щось справжнє',
        requires: { skillAtLeast: { people: 1 } },
        effects: { stats: { bonds: 3, understanding: 2, energy: -1 }, flags: { said_real_thing: true } },
      },
    ],
  },
  {
    id: 'misc.writing',
    follows: ['phase2.letters_home'],
    lead: 'Щось хоче, щоб його записали.',
    kind: 'routine',
    phase: [3, 4, 5],
    text: 'Ти починаєш записувати, що бачиш. Не для звіту. Просто щоб це не зникло.',
    options: [
      {
        id: 'write',
        text: 'Писати щодня',
        effects: { stats: { understanding: 3, energy: -2 }, flags: { keeps_diary: true } },
      },
      {
        id: 'burn',
        text: 'Спалити зошит — небезпечно',
        effects: { stats: { understanding: -2, trust: 2, energy: 1 } },
      },
      {
        id: 'show',
        text: 'Показати комусь близькому',
        effects: { stats: { understanding: 2, bonds: 2, trust: -1 }, flags: { diary_shown: true } },
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
    // Тільки коли військкомат/збірка лишили слід — «зронив з рук» трапляється з побутом.
    requires: { flagTrue: ['hid_call'] },
  },
  {
    id: 'ending.tihiy',
    kind: 'system',
    title: 'Тихий запас',
    epilogue:
      'Його «списали» за розкладеним графіком. Документи в порядку, дата в наказі — точна. Ніхто не помітив, коли саме все скінчилося.',
    defaultEpitaph: 'Списали за графіком. Без коментарів.',
    weight: 2,
    requires: { statAtMost: { understanding: 5 } },
  },
  {
    id: 'ending.poruch',
    kind: 'accident',
    title: 'Поруч із тим, хто вижив',
    epilogue:
      'Його винесли з позиції, яку ніхто не мав тримати. Той, хто вижив, не знав його прізвища, але запам’ятав його спальник.',
    defaultEpitaph: 'Віддав спальник. Більше не змерз.',
    weight: 3,
    // Не лише великі зв'язки: ще й передчасний день, щоб не перекривати пізні фінали.
    requires: { statAtLeast: { bonds: 8 }, dayAtMost: 38 },
  },
  {
    id: 'ending.dobra',
    kind: 'sacrifice',
    title: 'Добра пам’ять',
    epilogue:
      'Про нього згадують у відділенні без пафосу: «Він рахував блокпости й питав дурні питання». Це — найкраще, що тут можна отримати.',
    defaultEpitaph: 'Питав дурні питання. Ніхто не смів відповісти.',
    weight: 2,
    // Стає основним фіналом лише коли гравець справді дійшов до розуміння
    // й не втратив людей: потрібна й помірна довіра, інакше тіло просто не дійшло.
    requires: { statAtLeast: { understanding: 6, bonds: 5 } },
  },
  {
    id: 'ending.kryk',
    kind: 'sacrifice',
    title: 'Потайний крик',
    epilogue:
      'Він устиг сказати вголос те, що всі думали вночі. Це нічого не змінило. Це змінило трьох людей у бліндажі.',
    defaultEpitaph: 'Сказав це вголос. Один раз.',
    weight: 2,
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
      'Він вийшов сам. Дійшов до краю посадки й сів. Далі його несли. У документах це назвуть «пораненням, несумісним із життям». У селі скажуть: «помер на війні».',
    defaultEpitaph: 'Дійшов сам. Це вважається.',
    weight: 2,
    // Тільки коли здоров’я впало до нуля власними рішеннями (reason === 'wounds'),
    // і тільки на початку чи в середині — щоб не перекривати «долю» примерту на пізніх днях.
    requires: { dayAtMost: 40 },
  },
  {
    id: 'ending.letters',
    kind: 'quiet',
    title: 'Потім напишеш',
    epilogue:
      'Він не встиг. Листи знайшли в кишені, перев’язані шнурком. Один — недописаний, з датою, якої вже не було.',
    defaultEpitaph: 'Обіцяв написати завтра.',
    weight: 2,
    requires: { flagTrue: ['letters_help'] },
  },
  {
    id: 'ending.diary',
    kind: 'quiet',
    title: 'Зошит у підкладці',
    epilogue:
      'Зошит знайшли через рік. Сторінки прочитали вголос у редакції — і вирізали половину. Те, що лишилось, надрукували. Це вже не він, але це точніше за зведення.',
    defaultEpitaph: 'Писав, щоб не зникло.',
    weight: 2,
    requires: { flagTrue: ['keeps_diary'], statAtLeast: { understanding: 6 } },
  },
];