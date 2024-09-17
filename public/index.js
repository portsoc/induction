const data = await fetchData();
const ui = {};
ui.main = document.querySelector('main');
ui.levels = document.querySelectorAll('section.level');

async function fetchData() {
  const response = await fetch('./data/data.json');
  return await response.json();
}

function getLevelText(level) {
  const texts = {
    "L4": "Level 4 - BSc/MEng year 1",
    "L5": "Level 5 - BSc/MEng year 2",
    "L6": "Level 6 - BSc Final Year / MEng year 3",
    "L7": "Level 7 - MEng Year 4 / all MSc students",
  };

  return texts[level];
}



function populate() {
  for (const [level, plans] of Object.entries(data.plans)) {
    const levelSection = ui.main.querySelector(`section[data-level="${level}"]`);
    const levelHead = levelSection.querySelector('h2');
    levelHead.textContent = getLevelText(level);

    for (const plan of plans) {
      const planSect = document.querySelector('#course-plan').content.cloneNode(true).firstElementChild;
      levelSection.append(planSect);
      planSect.querySelector('.course-title').textContent = `${plan.title}`;
      // handle common events for all courses first
      if (data[level] && data[level].common) {
        for (const event of data[level].common.events) {
          if (event.not && event.not.includes(plan.code)) continue;
          const day = planSect.querySelector(`article[data-day="${event.day}"]`);
          populateEvent(day, event);
        }
      }

      // handle specific course events.
      if (data[level] && data[level][plan.code]) {
        for (const event of data[level][plan.code].events) {
          const day = planSect.querySelector(`article[data-day="${event.day}"]`);
          populateEvent(day, event);
        }
      }

      sortEvents(planSect);
    }

  }
}

function sortEvents(plan) {
  const eventsList = plan.querySelectorAll('.events-list');
  for (const list of eventsList) {
    const events = [...list.children];
    events.sort((eventa, eventb) => {
      return eventa.dataset.time - eventb.dataset.time;
    });
    for (const event of events) {
      event.parentElement.append(event);
    }
  }
}

function populateEvent(day, event) {
  for (const ph of day.querySelectorAll('.placeholder')) {
    ph.remove();
  }
  const eventElem = document.querySelector('#event-template').cloneNode(true).content.firstElementChild;
  day.querySelector('.events-list').append(eventElem);
  const startTimeEl = eventElem.querySelector('.time');
  const endTimeEl = eventElem.querySelector('.endtime');
  let endTime = Number.parseInt(event.time) + 1;
  if (event.duration) {
    endTime = Number.parseInt(event.time) + Number.parseInt(event.duration);
  }
  startTimeEl.textContent = `${event.time}:00`;
  endTimeEl.textContent = `${endTime}:00`;
  eventElem.querySelector('.title').textContent = event.title;
  eventElem.querySelector('.description').textContent = event.description;
  eventElem.querySelector('.building').textContent = `${event.building} Building`;
  eventElem.querySelector('.room').textContent = event.room;
  eventElem.dataset.time = event.time;
}

populate();
