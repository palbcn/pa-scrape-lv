(function() {

  const pwa = false;  
  if (pwa && navigator.serviceWorker)
      navigator.serviceWorker.register("serviceworker.js");

  function dateToLocaleLongEsString(date) {
    return new Date(date).toLocaleDateString("es", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function renderDates(info) {    
    document.getElementById("info-now").textContent = new Date().toLocaleString(
      "es"
    );
    document.getElementById("info-started").textContent = new Date(
      info.started
    ).toLocaleString("es");
    document.getElementById("info-loaded").textContent = new Date(
      info.loaded
    ).toLocaleString("es");
  }

  let articlesSection = document.getElementById("articles");
  let historySection = document.getElementById("history");
  let authorsSection = document.getElementById("authors");

  function renderArticle(article, index) {
    let newArticle = document.createElement("article");
    if (article.header == article.title) article.header = "";
    let articleHtml = `
    <h1 id="${index}">${article.title}</h1>
    <h2>${article.header}</h2>
    <h3>${article.author}</h3>
    <p>${new Date(article.datePublished).toLocaleString("es")}</p>
    <p><a href="${article.lnk}">[${article.lnk}]</a></p>
    <div>${article.html}</div>
  `;
    newArticle.innerHTML = articleHtml;
    articlesSection.appendChild(newArticle);
  }

  function renderArticles(articles) {
    articlesSection.innerHTML = "";
    articles.forEach(renderArticle);
  }

  // renders a full month calendar for the month containing monthDates
  function renderCalendar(container, monthDates, onClickCell) {
    const BLANK = " ";
    if (!Array.isArray(monthDates)) {
      let m = monthDates.getMonth();
      let y = monthDates.getFullYear();
      monthDates = [];
      for (let i = 1; i <= 31; i++) monthDates.push(new Date(y, m, i));
    }
    let monthDate = monthDates[0];
    let thisMonth = monthDate.getMonth();
    let thisYear = monthDate.getFullYear();
    let lastDayOfMonth = new Date(thisYear, thisMonth + 1, 0);
    let monthSquares = [];
    let monthDays = monthDates.map(d =>
      d.getFullYear() === thisYear && d.getMonth() === thisMonth
        ? d.getDate()
        : 0
    );
    let daysInMonth = lastDayOfMonth.getDate(); // day number of last day in month = days in month
    let startDay = new Date(thisYear, thisMonth, 1).getDay(); // week day of first day of the month
    let endDay = lastDayOfMonth.getDay(); // week day of last day of the month
    if (startDay != 1) {
      let blanks = startDay == 0 ? 7 : startDay;
      for (let i = 1; i < blanks; i++) {
        monthSquares.push(BLANK);
      }
    }
    for (let i = 1; i <= daysInMonth; i++) {
      let indates = monthDays.indexOf(i);
      if (indates === -1) monthSquares.push(-i);
      else monthSquares.push(i);
    }
    if (endDay != 0) {
      let blanks = endDay == 6 ? 1 : 7 - endDay;
      for (let i = 0; i < blanks; i++) {
        monthSquares.push(BLANK);
      }
    }

    let calendarGrid = document.createElement("div");
    calendarGrid.classList.add("calendar-grid");
    container.appendChild(calendarGrid);

    for (let i = 0; i < monthSquares.length; i++) {
      let calendarCell = document.createElement("div");
      calendarCell.classList.add("calendar-cell");
      if (monthSquares[i] == BLANK) {
        calendarCell.classList.add("blank");
      } else {
        calendarCell.classList.add("day");
        if (monthSquares[i] < 0) {
          calendarCell.classList.add("void");
        } else {
          calendarCell.addEventListener("click", function(event) {
            if (onClickCell) {
              let d = new Date(
                Date.UTC(thisYear, thisMonth, event.target.textContent)
              );
              onClickCell(d);
            }
          });
        }
        calendarCell.innerHTML = Math.abs(monthSquares[i]);
      }
      calendarGrid.appendChild(calendarCell);
    }
  }

  function onDayClick(day) {
    window.location.href = `/?${day.getTime()}`;
  }
  
  let $reload = document.getElementById("reload");
  if ($reload) $reload.addEventListener("click",function(event){
    fetch("/history", { method: 'DELETE'});    
  })

  function renderHistory(history) {
    history.sort((a, b) => b - a);
    //history.sort( (a, b) => a - b );
    let bymonth = {}; // group history entries by month
    history.forEach(function(elem) {
      elem = new Date(elem);
      let monthname = elem.toLocaleString("es", { month: "long" });
      let monthyear = `${monthname} de ${elem.getFullYear()}`;
      if (!bymonth[monthyear])
        bymonth[monthyear] = { month: monthyear, days: [] };
      bymonth[monthyear].days.push(elem);
    });
    // render by month
    historySection.innerHTLM = "";
    let months = Object.keys(bymonth);
    for (let i = 0; i < months.length; i++) {
      let monthgroup = bymonth[months[i]];
      historySection.insertAdjacentHTML(
        "beforeend",
        `<h3>de ${monthgroup.month}</h3>`
      );
      let calendarContainer = document.createElement("div");
      calendarContainer.classList.add("calendar-container");
      renderCalendar(calendarContainer, monthgroup.days, onDayClick);
      historySection.appendChild(calendarContainer);
    }
  }
  
  function makeCollapsable(section) {  
    function toggleCollapse(ev) {
      if (ev.target.nextElementSibling.style.display === "")
        ev.target.nextElementSibling.style.display = "none";  
      else 
        ev.target.nextElementSibling.style.display = "";    
    }  
    let collapseList = section.querySelectorAll(".collapse");
    // collapse class element makes its next sibling collapsable 
    for (let collapse of collapseList) {
      let collapsable = collapse.nextElementSibling;
      collapsable.style.display = "none";
      collapse.onclick = toggleCollapse;
    }
  }

  function renderAuthors(authorsInfo) {
    let authorsHTML = "";
    for (let [authorID, info] of Object.entries(authorsInfo.authors)) {
      if (info.author != "") {
        authorsHTML += `<h3 class="collapse">${info.author} (${info.articles.length})</h3><ul>`;
        info.articles.sort((a,b) => new Date(b.datePublished) - new Date(a.datePublished)); 
        info.articles.forEach( function(article) {
          let href = `"/?${article.fileID}#${article.index}"`;
          let displaydate = article.datePublished.slice(0, 10);
          authorsHTML += `<li><a href=${href}>${displaydate}</a> ${article.title}</li>`;
        });
        authorsHTML += `</ul>`;
      }
    }
    authorsSection.innerHTML = authorsHTML;
    makeCollapsable(authorsSection);
  }

  async function fetchAndRenderArticles(date, hash) {
    let response = date
      ? await fetch("/history/" + date)
      : await fetch("/articles");
    if (!date && response.status === 202) {
      setTimeout(fetchAndRenderArticles, 10000); // if not ready, retry in 10 seconds.
      return;
    }
    if (!response.ok)
      throw new Error(
        `Invalid response from fetch. Status: ${response.status}`
      );
    let articles = await response.json();
    renderArticles(articles);
    if (hash) location.hash = "#" + hash;
  }
  
  async function fetchAndRenderInfo() {
    let response = await fetch("/info");
    let info = await response.json();
    renderDates(info);
  }

  async function fetchAndRenderHistory() {
    let response = await fetch("/history");
    if (!response.ok)
      throw new Error(`An error has occured: ${response.status}`);
    let history = await response.json();
    renderHistory(history);
  }

  async function fetchAndRenderAuthors() {
    let response = {};
   
    try {
      response = await fetch("/authors");
    } catch (err) {
      console.error("fetchAuthors",err.message);
    }

    if (!response.ok)
      return console.error("fetchAuthors", response.status);
    
    let authors = await response.json();
    renderAuthors(authors);
  }
      
  let url = new URL(document.URL);  

  fetchAndRenderInfo();
    
  if (url.pathname === "/" || url.pathname === "/index.html" ) {
    let articlesdate = url.search ? Number(url.search.slice(1)) : null;
    let articlesindex = url.hash ? url.hash.slice(1) : null;    
    
    let frescos = articlesdate === null;
    let displaydate = articlesdate || Date.now();    
    
    document.getElementById("headerdate").textContent =
      (frescos ? "frescos del " : "del ") + dateToLocaleLongEsString(displaydate);
    
    fetchAndRenderArticles(articlesdate, articlesindex);
    
    /*document.getElementById("delete").style.visibility = frescos ? "hidden" : "visible";
    document.getElementById("delete").onclick = async function(ev) {
      if (confirm(`Delete ${articlesdate} Are you sure?`)) {
        let response = await fetch(`/history/${articlesdate}`, {
          method: "DELETE"
        });
        alert(`DELETE ${articlesdate} responded status: ${response.status}`);
      }
    }*/
    
  } else if (url.pathname === "/history.html") {
    fetchAndRenderHistory();
    fetchAndRenderAuthors();

  }  
  

})();
