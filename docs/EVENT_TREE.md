# Дерево подій

Генерується з контенту: `npm run tree`. Інтерактивна картинка з усіма 76 картками — [event-tree.html](event-tree.html).

- **Товста стрілка** — `next`: вибір гарантовано веде до події (іноді через N днів).
- **Тонка** — вчинок відкриває картку (`requires.flagTrue`).
- **Пунктир** — вчинок відкриває варіант на іншій картці.
- Echo-зв’язки (м’які спогади) показані лише на картинці.

Кожна картка показується **не більше одного разу за забіг**, тож дерево не повторюється, а гілка або спрацьовує, або ні.

```mermaid
flowchart LR
  subgraph F1["Фаза 1"]
    call_queue["call.queue<br/><small>Черга у військкоматі. Хтось п…</small>"]
  end
  subgraph F2["Фаза 2"]
    phase2_sapper["phase2.sapper<br/><small>Толік, сапер із третьої роти,…</small>"]
    phase2_split["phase2.split<br/><small>Прапорщик будує роту. Каже: «…</small>"]
  end
  subgraph F3["Фаза 3"]
    call_tried_to_leave_after["call.tried_to_leave_after<br/><small>У документах хтось дописав пр…</small>"]
    phase3_loss["phase3.loss<br/><small>Уранці хлопця з сусіднього ві…</small>"]
    phase3_medic["phase3.medic<br/><small>Оля, санінструкторка, каже, щ…</small>"]
    phase3_food_ration["phase3.food_ration<br/><small>Пакунок від волонтерів. Три ш…</small>"]
    phase3_coward["phase3.coward<br/><small>Командир відділення пропонує…</small>"]
    phase3_photo["phase3.photo<br/><small>Хтось приніс фотоапарат. Хлоп…</small>"]
  end
  subgraph F4["Фаза 4"]
    phase3_letter_followup["phase3.letter_followup<br/><small>Той лист досі не дописаний. В…</small>"]
    phase4_informer_after["phase4.informer_after<br/><small>Хлопці перестали говорити при…</small>"]
    phase4_doubt["phase4.doubt<br/><small>Уночі, коли всі сплять, ти ло…</small>"]
    phase4_standing["phase4.standing<br/><small>Командир роти збирає тих, хто…</small>"]
    phase4_wound["phase4.wound<br/><small>Уламок зайшов у стегно. Оля к…</small>"]
    phase4_tolko_dies["phase4.tolko_dies<br/><small>Толіка більше немає. Саме йог…</small>"]
    phase5_promises["phase5.promises<br/><small>Хлопець просить обіцянку: «Як…</small>"]
    phase5_photo_found["phase5.photo_found<br/><small>У кишені — те фото. Мала, зал…</small>"]
    line_volunteers_thanks["line.volunteers_thanks<br/><small>Прийшла відповідь від волонте…</small>"]
    line_assault_after["line.assault_after<br/><small>Твоя «штурмова» виявилась зви…</small>"]
    line_fake_informer["line.fake_informer<br/><small>Командир відділення питає, чо…</small>"]
    line_named_photo["line.named_photo<br/><small>Волонтери надіслали фото: наш…</small>"]
  end
  subgraph F5["Фаза 5"]
    line_kept_promise["line.kept_promise<br/><small>Той хлопець живий. Дивиться н…</small>"]
    line_known_plan["line.known_plan<br/><small>Ти знаєш план. Він не передба…</small>"]
  end
  call_queue ==>|"Спробувати вийти з черги й… · +14 дн."| call_tried_to_leave_after
  phase2_sapper ==>|"Запитати, скільки з тих, ко… · +12 дн."| phase4_tolko_dies
  phase2_split ==>|"Вийди першим, поки не обрали · +5 дн."| line_assault_after
  phase3_loss ==>|"Почати писати лист його мамі · +10 дн."| phase3_letter_followup
  phase3_food_ration ==>|"Записати адресу волонтерів,… · +7 дн."| line_volunteers_thanks
  phase3_coward ==>|"Погодитись — це прикриття · +6 дн."| phase4_informer_after
  phase3_coward ==>|"Погодитись і не робити нічо… · +6 дн."| line_fake_informer
  phase3_photo ==>|"Попросити, щоб надіслали ма… · +8 дн."| phase5_photo_found
  phase2_sapper -.->|"відкриває: Сказати Толікові"| phase4_doubt
  phase4_standing ==>|"Запитати, у чому план поляг… · +3 дн."| line_known_plan
  phase3_medic -.->|"відкриває: Обробити сам, як учил…"| phase4_wound
  phase5_promises ==>|"Пообіцяти сказати інше — те… · +3 дн."| line_kept_promise
  line_volunteers_thanks ==>|"Написати всі імена, включно… · +4 дн."| line_named_photo
```
