// alert("Hello");
chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
  // tab = tab.id;
  var tab = tabs[0];
  tabUrl = tab.url;
  let out = 0;
  var abc = 0;
  const tabId = tab.id;
  if (tabUrl === "https://hr.codal.com/attendance") {
    document.getElementById("getHours").addEventListener("click", () => {
      console.log("Popup DOM fully loaded and parsed");
      const totalHours = document.getElementById("seletedHourValue").value;
      const totalMinutes = document.getElementById(
        "selectedMinutesValue"
      ).value;
      function modifyDOM(seletedHour = 8, selectedMinutes = 00) {
        //You can play with your DOM here or check URL against your regex
        const takeChildLen =
          document.body.getElementsByClassName("titem ti-atte tooltip").length -
          1;
        const divData = document.body.getElementsByClassName(
          "titem ti-atte tooltip"
        )[takeChildLen];
        function convertHMS(value) {
          const sec = parseInt(value, 10); // convert value to number if it's string
          let hours = Math.floor(sec / 3600); // get hours
          let minutes = Math.floor((sec - hours * 3600) / 60); // get minutes
          let seconds = sec - hours * 3600 - minutes * 60; //  get seconds
          // add 0 if value < 10; Example: 2 => 02
          if (hours < 10) {
            hours = "0" + hours;
          }
          if (minutes < 10) {
            minutes = "0" + minutes;
          }
          if (seconds < 10) {
            seconds = "0" + seconds;
          }
          abc = hours;
          return hours + ":" + minutes + ":" + seconds; // Return is HH : MM : SS
        }
        let currentDate = new Date();
        currentDate = currentDate.getDate();
        const row = document.getElementsByClassName("titem-row")[currentDate];
        const atte = row.getElementsByClassName("ti-atte")[0];
        const ps = atte.getElementsByTagName("p");
        const pArray = [].slice.call(ps);
        const lastEntry = pArray[pArray.length - 1];
        const spans = lastEntry.getElementsByTagName("span");
        const actualWork = row
          .getElementsByClassName("ti-work")[0]
          .innerHTML.trim();
        const workHours = actualWork.split(":")[0];
        const workMin = actualWork.split(":")[1];
        let wantToComplete = seletedHour * 3600 + selectedMinutes * 60;
        const totalWorkSecond = workHours * 3600 + workMin * 60;
        const totalSecondsRequired = wantToComplete - totalWorkSecond;
        const start = spans[0].innerHTML?.trim();
        const startHourSeconds = start.split(" ")[0].split(":")[0] * 3600;
        const startMinSeconds = start.split(" ")[0].split(":")[1] * 60;
        const total = startHourSeconds + startMinSeconds + totalSecondsRequired;
        out = convertHMS(total);
        return [out, abc];
      }

      //We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: modifyDOM,
          args: [totalHours, totalMinutes],
        },
        (results) => {
          let textFieldElement = document.getElementById("textField");
          if (results[0]["result"][1] >= 07) {
            textFieldElement.style.color = "red";
          } else {
            textFieldElement.style.color = "green";
          }
          textFieldElement.value = results[0]["result"][0];
        }
      );
    });
  } else {
    document.getElementById("textField").value = "Not supported url";
  }
});
