let store = Immutable.Map({
  menu: "home",
  rovers: Immutable.List([]),
  apod: "",
});

/**
 * update store
 * @param {store} state current store
 * @param {store} newState new store
 */
const updateStore = (state, newState) => {
  store = state.merge(newState);
  render(root, store);
};

/**
 * render body
 * @param {HTMLBodyElement} root main element
 * @param {store} state current store
 */
const render = async(root, state) => {
  root.innerHTML = App(state);
};

/**
 * create content
 * @param {store} state
 * @returns {string} body context
 */
const App = (state) => {
  const renderBody = swithBody(state);
  const createHeader = createContext("<header>", "</header>", renderHeader);
  const createBody = createContext("<main>", "</main>", renderBody);

  return createHeader([state]) + createBody([state]);
};

/**
 * swith menu
 * @param {string} menu home or rover name
 */
const swithMenu = (menu) => {
  updateStore(store, { menu });
};

// add our markup to the page
const root = document.getElementById("root");

/**
 * listening for load event because page should load before any JS is called
 */
window.addEventListener("load", () => {
  render(root, store);
});

// ------------------------------------------------------  COMPONENTS


/**
 * @description createContext
 * @param {string} startTag
 * @param {string} endTag
 * @param {Function} fnCreate
 * @returns {string} context
 */
const createContext = function(startTag, endTag, fnRender) {
  return function(args) {
    const contextList = [];

    contextList.push(startTag);

    if (args == null || args.length === 0) {
      contextList.push(`<a>Loading...</a>`);
    } else {
      args.forEach((e) => {
        contextList.push(fnRender.call(e));
      });
    }

    contextList.push(endTag);
    return contextList.join("");
  };
};

/**
 * render header context
 * @returns {string} header context
 */
const renderHeader = function() {
  const rovers = this.get("rovers").toArray();

  if (rovers.length === 0) {
    loadRovers(this);
  }

  const fnRender = function() { return `<a onclick=swithMenu('${this.name}')>${this.name}</a>`; }

  const createMenuDesktop = createContext(
    `<div class="menu"><a onclick=swithMenu('home')>Home</a>`, `</div>`,
    fnRender
  );

  const createMenuMobile = createContext(
    `<div class="dropdown"><a onclick=document.getElementById("myDropdown").classList.toggle("show")>▦</a>
      <div id="myDropdown" class="dropdown-content">`, `</div></div>`, fnRender
  );

  const menuDesktop = createMenuDesktop(rovers);
  const menuMobile = createMenuMobile(rovers);

  return menuDesktop + menuMobile;
};

/**
 * return function render home or rover
 * @param {store} state
 * @returns {Function} main context
 */
const swithBody = (state) => {
  const menu = state.get("menu");

  if (menu === "home") {
    return renderHome;
  }

  return renderRover;
};

/**
 * render gallery context
 * @returns {string} gallery context
 */
const renderHome = function() {
  const apod = this.get("apod");

  return `<section>
    <h3>APOD</h3>
    <p>
        One of the most popular websites at NASA is the Astronomy Picture of the Day. In fact, this website is one of
        the most popular websites across all federal agencies. It has the popular appeal of a Justin Bieber video.
        This endpoint structures the APOD imagery and associated metadata so that it can be repurposed for other
        applications. In addition, if the concept_tags parameter is set to True, then keywords derived from the image
        explanation are returned. These keywords could be used as auto-generated hashtags for twitter or instagram feeds;
        but generally help with discoverability of relevant imagery.
    </p>
    ${ImageOfTheDay(apod)}
  </section>`;
};

/**
 * render rover context
 * @returns {string} rover context
 */
const renderRover = function() {
  const menu = this.get("menu");
  const rovers = this.get("rovers");
  const rover = rovers.find((x) => x.name === menu);

  if (rover == null) {
    return `<a>rover not found<a>`;
  }

  const { manifests, photos } = rover;

  if (manifests == null) {
    loadManifests(this, rover);
  } else if (photos == null) {
    loadPhotos(this, rover);
  }

  return `${renderTitle(manifests)} ${renderPhotos(photos)}`;
};

const renderTitle = (manifests) => {
  if (manifests == null) {
    return `<a>Loading...</a>`;
  }

  return `<section>
        <br>
        <table class="manifests">
          <tr><th>Name</th><td>${manifests.name}</td></tr>
          <tr><th>Launch Date</th><td>${manifests.launch_date}</td></tr>
          <tr><th>Landing Date</th><td>${manifests.landing_date}</td></tr>
          <tr><th>Status</th><td>${manifests.status}</td></tr>
          <tr><th>Maxsol</th><td>${manifests.max_sol}</td></tr>
          <tr><th>Maxdate</th><td>${manifests.max_date}</td></tr>
          <tr><th>Total photos</th><td>${manifests.total_photos}</td></tr>
      </table>
    </section>`;
};

const renderPhotos = (photos) => {
  const fnRender = function() { return `<img src="${this.src}" alt="..." loading="lazy">`; }

  const createListImage = createContext(
    `<section class="photos">`, `</section>`,
    fnRender
  );

  return createListImage(photos);
};

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {
  // If image does not already exist, or it is not from today -- request it again
  const today = new Date();

  if (!apod || apod.date === today.getDate()) {
    return getImageOfTheDay(store);
  }

  // check if the photo of the day is actually type video!
  if (apod.media_type === "video") {
    return `
          <p>See today's featured video <a href="${apod.url}">here</a></p>
          <p>${apod.title}</p>
          <p>${apod.explanation}</p>
      `;
  } else {
    return `
          <img src="${apod.image.url}" height="350px" width="100%" />
          <p>${apod.image.explanation}</p>
      `;
  }
};

// ------------------------------------------------------  API CALLS

/**
 * load apod
 * @param {store} state
 */
const getImageOfTheDay = (state) => {
  fetch(`http://localhost:3000/apod`)
    .then((res) => res.json())
    .then((apod) => updateStore(state, { apod }));
  return `<h3>Loading...</h3>`;
};

/**
 * load all rovers
 * @param {store} state
 */
const loadRovers = (state) => {
  fetch(`http://localhost:3000/rovers`)
    .then((res) => res.json())
    .then((data) => {
      const rovers = Immutable.List(
        data.rovers.map((x) => {
          return { name: x.name, id: x.id };
        })
      );
      updateStore(state, { rovers });
    });
};

/**
 * load manifests of rover from the Nasa Mars Rover api
 * @param {store} state
 * @param {object} rover
 */
const loadManifests = (state, rover) => {
  fetch(`http://localhost:3000/manifests/${rover.name}`)
    .then((res) => res.json())
    .then((photo) => {
      const {
        landing_date,
        launch_date,
        max_date,
        max_sol,
        name,
        status,
        total_photos,
      } = photo.photo_manifest;

      rover.manifests = {
        landing_date,
        launch_date,
        max_date,
        max_sol,
        name,
        status,
        total_photos,
      };
      loadPhotos(state, rover);
    });
};

/**
 * load photos of images from the Nasa Mars Rover api
 * @param {store} state
 * @param {object} rover
 */
const loadPhotos = (state, rover) => {
  fetch(
      `http://localhost:3000/rovers/photos/${rover.name}/${rover.manifests.max_date}`
    )
    .then((res) => res.json())
    .then((data) => {
      rover.photos = data.photos.map((x) => {
        return { id: x.id, src: x.img_src };
      });
      updateStore(state, state);
    });
};