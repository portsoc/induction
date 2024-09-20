let data = {};
const ui = {};
ui.main = document.querySelector('main');
ui.header = document.querySelector('header');
ui.levels = document.querySelectorAll('section.level');
ui.topnav = ui.header.querySelector('.top-nav');
ui.coursenav = ui.header.querySelector('.course-nav');

async function fetchData() {
  const response = await fetch('./data/data.json');
  data = await response.json();
}

function getLevelText(level) {
  const texts = {
    L4: 'Level 4 - BSc/MEng year 1',
    L5: 'Level 5 - BSc/MEng year 2',
    L6: 'Level 6 - BSc Final Year / MEng year 3',
    L7: 'Level 7 - MEng Final Year / all MSc students',
  };

  return texts[level];
}

function buildNav() {
  for (const level of Object.keys(data.plans)) {
    const btn = document.createElement('input');
    btn.id = 'l' + level;
    btn.type = 'radio';
    btn.name = 'level';
    btn.value = getLevelText(level);
    btn.dataset.level = level;
    btn.addEventListener('click', showCourseNav);
    ui.topnav.append(btn);

    const label = document.createElement('label');
    label.htmlFor = 'l' + level;
    label.textContent = getLevelText(level);
    ui.topnav.append(label);
  }
}


function showCourseNav(e) {
  hideAllPlans();
  showInfo();
  buildCourseNav(e.target.dataset.level);
  ui.coursenav.scrollIntoView({ behavior: 'smooth' });
}

function buildCourseNav(level) {
  ui.coursenav.classList.remove('hidden');
  ui.coursenav.innerHTML = '<p>Select a course:</p>';
  for (const course of data.plans[level]) {
    const courseInput = document.createElement('input');
    courseInput.type = 'radio';
    courseInput.id = `course-${course.code}`;
    courseInput.name = 'course';
    courseInput.dataset.course = course.code;
    courseInput.dataset.level = level;

    const courseLabel = document.createElement('label');
    courseLabel.htmlFor = `course-${course.code}`;
    courseLabel.textContent = course.title;

    ui.coursenav.append(courseInput);
    ui.coursenav.append(courseLabel);

    courseInput.addEventListener('click', showPlan);
  }
}

function showInfo() {
  ui.main.querySelector('.info').classList.remove('hidden');
}

function showPlan(e) {
  hideAllPlans();
  let course, level;
  if (!e) {
    course = localStorage.getItem('course');
    level = localStorage.getItem('level');
    // select the course and level buttons

    if (level) {
      ui.topnav.querySelector(`input[data-level="${level}"]`).checked = true;
    }

    buildCourseNav(level);

    if (course) {
      const courseBtn = ui.coursenav.querySelector(`input[data-course="${course}"]`);
      courseBtn.checked = true;
    }
  } else {
    level = e.target.dataset.level;
    course = e.target.dataset.course;
    localStorage.setItem('course', course);
    localStorage.setItem('level', level);
  }
  const levelSect = ui.main.querySelector(`section[data-level="${level}"]`);
  const plan = levelSect.querySelector(`section[data-course="${course}"]`);
  levelSect.classList.remove('hidden');
  plan.classList.remove('hidden');
  ui.main.scrollIntoView({ behavior: 'smooth' });
}

function hideAllPlans() {
  const levels = document.querySelectorAll('.level');
  for (const level of levels) {
    for (const plan of level.querySelectorAll('.plan')) {
      plan.classList.add('hidden');
    }
    level.classList.add('hidden');
  }
}


function populate() {
  for (const [level, plans] of Object.entries(data.plans)) {
    const levelSection = ui.main.querySelector(`section[data-level="${level}"]`);


    for (const plan of plans) {
      const planSect = document.querySelector('#course-plan').content.cloneNode(true).firstElementChild;
      levelSection.append(planSect);
      const levelHead = planSect.querySelector('.levelhead');
      levelHead.textContent = `${plan.title}: Level ${level.charAt(1)}`;
      planSect.dataset.course = plan.code;
      planSect.classList.add('hidden');
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

function setTitle() {
  const title = ui.header.querySelector('#title');
  title.textContent = data.title;
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
  let endTime = `${Number.parseInt(event.time) + 1}:00`;
  if (event.duration) {
    endTime = fixEndTime(event.time, event.duration);
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
    staffElem.textContent = `Staff: ${event.staff.join(', ')}`;
  }

  eventElem.dataset.time = event.time;
}

function fixEndTime(start, duration) {
  if (!Number.isInteger(duration)) {
    const frac = duration - Number.parseInt(duration);
    const mins = Math.round(60 * frac);
    return (`${Number.parseInt(start) + Number.parseInt(duration)}:${mins}`);
  } else {
    return (`${Number.parseInt(start) + duration}:00`);
  }
}

async function main() {
  await fetchData();
  setTitle();
  populate();
  buildNav();
  showInfo();
  if (localStorage.getItem('course') && localStorage.getItem('level')) {
    showPlan();
  }
}

main();
