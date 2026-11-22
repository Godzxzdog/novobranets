// Фото з Wikimedia Commons. Усі кадри — вільного використання, з підписами.
// ВАЖЛИВО: це реальні фото реальної війни. Підпис під кожним кадром показує
// автора й ліцензію — це не декор, а умова використання.
//
// Вшивання: build.mjs читає файли з assets/photos і вкладає кожне як data-URI
// у збірку, тож гра лишається одним HTML-файлом без інтернету.

export interface Photo {
  key: string;
  /** Назва файлу без розширення в assets/photos. */
  file: string;
  /** Що на кадрі — для alt і для підпису на екрані. */
  caption: string;
  author: string;
  license: string;
  page: string;
}

export const PHOTOS: Record<string, Photo> = {
  trench_avdiivka: {
    key: 'trench_avdiivka',
    file: 'assets/photos/trench_avdiivka.jpg',
    caption: 'Позиція в лісі під Авдіївкою',
    author: 'Wikimedia Commons',
    license: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:47th_brigade_trench_fight_near_avdiivka.png',
  },
  trench_100: {
    key: 'trench_100',
    file: 'assets/photos/trench_100.jpg',
    caption: 'Окоп 100-ї бригади',
    author: '100 окрема механізована бригада',
    license: 'Public domain',
    page: 'https://commons.wikimedia.org/wiki/File:Fighters_of_the_100th_Mechanised_Brigade_in_a_trench.jpg',
  },
  training_47a: {
    key: 'training_47a',
    file: 'assets/photos/training_47a.jpg',
    caption: 'Навчання 47-ї бригади',
    author: 'Ukrainian Ground Forces',
    license: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Soldiers_47th_ombr_training.jpg',
  },
  training_47b: {
    key: 'training_47b',
    file: 'assets/photos/training_47b.jpg',
    caption: 'Окоп на навчаннях',
    author: 'Ukrainian Ground Forces',
    license: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Two_soldiers_47th_ombr_training.jpg',
  },
  training_cqb: {
    key: 'training_cqb',
    file: 'assets/photos/training_cqb.jpg',
    caption: 'Зимове навчання, маркери замість зброї',
    author: 'АрміяInform',
    license: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:AFU_paintball_training_2022_01.jpg',
  },
  cemetery_lychakiv: {
    key: 'cemetery_lychakiv',
    file: 'assets/photos/cemetery_lychakiv.jpg',
    caption: 'Військова ділянка Личаківського цвинтаря',
    author: 'Pudelek',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Ukrainian_military_cemetery_at_Lychakiv_Cemetery_01.jpg',
  },
};
