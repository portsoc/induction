import * as core from '../core.js';
let data;
const ui = {};
ui.main = document.querySelector('main');
ui.header = document.querySelector('header');
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

async function fetchData() {
  const response = await fetch('../data/data.json');
  data = await response.json();
}

function setTitle() {
  ui.header.querySelector('h1').textContent = `${data.title} - Staff View`;
}

function populateDays() {
  for (const day of days) {
    const daySect = document.querySelector('#day-template').content.cloneNode(true).firstElementChild;

    daySect.querySelector('.day-title').textContent = day;
    daySect.dataset.day = day;
    ui.main.append(daySect);
  }

  addEvents();
  sortEvents();
}

function addEvents() {
  // need to go through all levels and plans and then find their events
  // and then put them in the right day.
  for (const [level, plans] of Object.entries(data.plans)) {
    // handle common events first
    if (data[level].common) {
      for (const event of data[level].common.events) {
        const eventElem = createEvent(event);
        eventElem.querySelector('.info-level').textContent = level;
        eventElem.dataset.level = level;
        const infoElem = eventElem.querySelector('.info-courses');
        const fixedCourses = fixCourses(level, event.not);
        infoElem.textContent = fixedCourses.displayString;
        eventElem.dataset.courses = JSON.stringify(fixedCourses.courses);
      }
    }

    for (const plan of plans) {
      if ((data[level] && data[level][plan.code])) {
        for (const event of data[level][plan.code].events) {
          const eventElem = createEvent(event);
          eventElem.querySelector('.info-level').textContent = level;
          eventElem.dataset.level = level;
          eventElem.querySelector('.info-courses').textContent = plan.title;
          eventElem.dataset.courses = JSON.stringify([plan.code]);
        }
      }
    }
  }
}

function sortEvents() {
  const days = ui.main.querySelectorAll('.day');
  for (const day of days) {
    const eventsList = day.querySelector('.events');
    const events = [...eventsList.children];
    events.sort((eventa, eventb) => {
      return eventa.dataset.time - eventb.dataset.time;
    });
    for (const event of events) {
      event.parentElement.append(event);
    }
  }
}


function createEvent(event) {
  const eventElem = document.querySelector('#event-template').content.cloneNode(true).firstElementChild;
  const dayElem = document.querySelector(`section[data-day="${event.day}"] .events`);
  dayElem.querySelector('.placeholder').classList.add('hidden');
  dayElem.append(eventElem);
  const startTimeEl = eventElem.querySelector('.time');
  const endTimeEl = eventElem.querySelector('.endtime');
  let endTime = `${Number.parseInt(event.time) + 1}:00`;
  if (event.duration) {
    endTime = core.fixEndTime(event.time, event.duration);
  }
  startTimeEl.textContent = `${event.time}:00`;
  endTimeEl.textContent = endTime;
  eventElem.querySelector('.title').textContent = event.title;
  eventElem.querySelector('.description').textContent = event.description;
  if (event.online) {
    const linkElem = eventElem.querySelector('.link');
    linkElem.innerHTML = `<a href="${event.url}">Online, click to join</a>`;
    linkElem.classList.remove('hidden');
    eventElem.querySelector('.building').classList.add('hidden');
    eventElem.querySelector('.room').classList.add('hidden');
  } else {
    eventElem.querySelector('.building').textContent = `${event.building} Building`;
    eventElem.querySelector('.room').textContent = event.room;
    if (event.building) {
      // lookup the building url in data.buildings
      const [building] = data.buildings.filter(br => br.name === event.building);
      const mapElem = eventElem.querySelector('.map');
      if (building?.url) {
        mapElem.innerHTML = `(<a href="${building.url}">map</a>)`;
        mapElem.classList.remove('hidden');
      }
    }
  }

  if (event.staff) {
    const staffElem = eventElem.querySelector('.staff');
    staffElem.classList.remove('hidden');

    staffElem.textContent = 'Staff: ';
    eventElem.dataset.staff = JSON.stringify(event.staff);
    for (const staff of event.staff) {
      if (data.staff.nonsoc.includes(staff)) {
        staffElem.innerHTML += `${staff}, `;
      } else {
        const parts = staff.toLowerCase().split(' ');
        staffElem.innerHTML += `<a href="./?staff=${parts.join('_')}">${staff}</a>, `;
      }
    }
    staffElem.innerHTML = staffElem.innerHTML.replace(/(^[,\s]+)|([,\s]+$)/g, '');
  }

  if (event.ugpts) {
    eventElem.dataset.staff = JSON.stringify(data.staff.ugpts);
  }

  eventElem.dataset.time = event.time;
  return eventElem;
}

function fixCourses(level, excludedCourses) {
  const retval = {};
  retval.displayString = '';
  retval.courses = [];
  const allCourses = data.plans[level];

  if (!excludedCourses) {
    for (const course of allCourses) {
      retval.courses.push(course.code);
    }
    retval.displayString = 'All courses';
  } else {
    for (const course of allCourses) {
      if (!excludedCourses.includes(course.code)) {
        retval.displayString += `${course.title}, `;
        retval.courses.push(course.code);
      }
    }
    retval.displayString = retval.displayString.replace(/(^[,\s]+)|([,\s]+$)/g, '');
  }

  return retval;
}

function hideAllEvents() {
  for (const event of document.querySelectorAll('.event')) {
    event.classList.add('hidden');
  }
}

function showEventsForStaff(name) {
  hideAllEvents();
  for (const event of document.querySelectorAll('.event')) {
    if (!event.dataset.staff) continue;
    const staff = JSON.parse(event.dataset.staff);
    for (const person of staff) {
      if (person.toLowerCase() === name) {
        event.classList.remove('hidden');
        break;
      }
    }
  }
  fixEmptyDays();
}

function showEventsForLevel(level) {
  hideAllEvents();
  for (const event of document.querySelectorAll('.event')) {
    if (event.dataset.level === level) {
      event.classList.remove('hidden');
    }
  }
  fixEmptyDays();
}

function showEventsForCourse(course) {
  hideAllEvents();
  for (const event of document.querySelectorAll('.event')) {
    const eventCourses = JSON.parse(event.dataset.courses);
    for (const eventCourse of eventCourses) {
      console.log(eventCourse, course);
      if (course === eventCourse) {
        event.classList.remove('hidden');
        break;
      }
    }
  }
  fixEmptyDays();
}


function fixEmptyDays() {
  for (const dayElem of ui.main.querySelectorAll('.day')) {
    if (allEventsHidden(dayElem)) {
      dayElem.querySelector('.placeholder').classList.remove('hidden');
    }
  }
}

function allEventsHidden(dayElem) {
  for (const event of dayElem.querySelector('.events').children) {
    if (!event.classList.contains('hidden')) {
      return false;
    }
  }

  return true;
}

async function main() {
  await fetchData();
  setTitle();
  populateDays();
  const params = new URLSearchParams(window.location.search);
  if (params.has('staff')) {
    const staffName = params.get('staff').replaceAll('_', ' ').toLowerCase();
    showEventsForStaff(staffName);
  } else if (params.has('level')) {
    showEventsForLevel(params.get('level').toUpperCase());
  } else if (params.has('course')) {
    showEventsForCourse(params.get('course').toLowerCase());
  }
}

main();
