// alert("Hello");
chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
  // tab = tab.id;
  var tab = tabs[0];
  tabUrl = tab.url;
  let youCanLeave = 0;
  let finalLeaveHours = 0;
  const tabId = tab.id;
  if (tabUrl === "https://hr.codal.com/attendance") {
    document.getElementById("getHours").addEventListener("click", () => {
      document.getElementById("hurryTag").style.display = "none";
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
          if (hours < 10) {
            hours = "0" + hours;
          }
          if (minutes < 10) {
            minutes = "0" + minutes;
          }
          let response = {
            hour: +hours,
            minute: +minutes,
          };
          finalLeaveHours = +hours;
          return response;
        }
        let currentDate = new Date();
        currentDate = currentDate.getDate();
        const row = document.getElementsByClassName("titem-row")[currentDate];

        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Months start at 0!
        let dd = today.getDate();

        if (dd < 10) dd = "0" + dd;
        if (mm < 10) mm = "0" + mm;

        const formattedToday = dd + "-" + mm + "-" + yyyy;

        if (row.classList.contains("day-off")) {
          return "DAY_OFF";
        }
        const atte = row.getElementsByClassName("ti-atte")[0];
        const ps = atte.getElementsByTagName("p");
        const pArray = [].slice.call(ps);
        const lastEntry = pArray[pArray.length - 1];
        const spans = lastEntry?.getElementsByTagName("span");
        if (spans === undefined) {
          return {
            status: "Empty",
            formattedToday: formattedToday,
          };
        }
        const actualWork = row
          .getElementsByClassName("ti-work")[0]
          .innerHTML.trim();
        const workHours = actualWork.split(":")[0];
        const workMin = actualWork.split(":")[1];
        if (
          +workHours > +seletedHour ||
          (+workHours >= +seletedHour && +workMin >= +selectedMinutes)
        ) {
          return "HOURS_COMPLETED";
        }
        let wantToComplete = seletedHour * 3600 + selectedMinutes * 60;
        const totalWorkSecond = workHours * 3600 + workMin * 60;
        const totalSecondsRequired = wantToComplete - totalWorkSecond;
        const start = spans[0].innerHTML?.trim();
        if (spans[1]?.innerHTML?.trim()) {
          return { status: "MISS_PUNCH", actualWork: actualWork };
        }
        const startHourSeconds = start.split(" ")[0].split(":")[0] * 3600;
        const startMinSeconds = start.split(" ")[0].split(":")[1] * 60;
        const total = startHourSeconds + startMinSeconds + totalSecondsRequired;
        let k =
          today.getHours() > 12
            ? (today.getHours() - 12) * 3600
            : today.getHours() * 3600;
        k = k + today.getMinutes() * 60;
        const l = startHourSeconds + startMinSeconds;
        const rh = wantToComplete - totalWorkSecond - (k - l);
        // Formula 8(totalHours need to complete)  - total work done - (current time - last in time)
        let remainingHour = convertHMS(rh);
        if (k === total || k > total) {
          remainingHour = false;
        }
        youCanLeave = convertHMS(total);
        let trHtml =
          "<thead><tr class='title-tr'><td colspan='2'>" +
          formattedToday +
          "</td></tr></thead><tbody><tr class='title-tr'><td>IN</td><td>OUT</td></tr>";
        pArray?.forEach((ele) => {
          const stag = ele.getElementsByTagName("span");
          const end = stag[1].innerHTML?.replace("-", "").trim();
          const start = stag[0].innerHTML?.replace("-", "")?.trim();
          trHtml += `<tr><td>${start ? start : "-"}</td><td>${
            end ? end : "-"
          }</td></tr>`;
        });
        trHtml += "</tbody>";
        const table = `<table class="entry-table">${trHtml}</table>`;
        return {
          leaveTime: youCanLeave,
          leaveHour: finalLeaveHours,
          table: table,
          remainingHour: remainingHour,
        };
      }

      //We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: modifyDOM,
          args: [totalHours, totalMinutes],
        },
        (results) => {
          let dateOfDay = document.getElementById("dateOfDay");
          dateOfDay.style.display = "none";
          let resultDetails = results[0]["result"];
          if (resultDetails == "DAY_OFF") {
            let textFieldElement = document.getElementById("textField");
            textFieldElement.value = "DAY OFF";
            document.getElementById("h2-title").remove();
          } else if (resultDetails == "HOURS_COMPLETED") {
            let textFieldElement = document.getElementById("textField");
            textFieldElement.value = "Your hours already completed.";
            document.getElementById("h2-title-remainig").style.display = "none";
            document.getElementById("textFieldRemaining").style.display =
              "none";
            document.getElementById("h2-title").style.display = "none";
          } else if (resultDetails["status"] == "Empty") {
            dateOfDay.innerHTML = resultDetails["formattedToday"];
            let textFieldElement = document.getElementById("textField");
            textFieldElement.value = "present not marked for today.";
            textFieldElement.style.color = "red";
            dateOfDay.style.display = "block";
            document.getElementById("h2-title").remove();
          } else if (resultDetails?.status == "MISS_PUNCH") {
            document.getElementById("h2-title").remove();
            document.getElementById("textField").remove();
            document.getElementById("miss_punch_div").style.display = "block";
            document.getElementById("miss_punch").style.display = "block";
            let textFieldElement = document.getElementById("miss_punch");
            textFieldElement.value = `${resultDetails?.actualWork}`;
            textFieldElement.style.color = "red";
          } else {
            let leaveTimeResult = resultDetails["leaveTime"];
            let remainingHour = resultDetails["remainingHour"];
            let currentDate = new Date();
            let currentHour = currentDate.getHours();
            let currentMinute = currentDate.getMinutes();
            if (remainingHour) {
              let textFieldElement =
                document.getElementById("textFieldRemaining");
              if (remainingHour["hour"] < 10) {
                remainingHour["hour"] = "0" + remainingHour["hour"];
              }
              if (remainingHour["minute"] < 10) {
                remainingHour["minute"] = "0" + remainingHour["minute"];
              }
              textFieldElement.style.fontSize = "16px";
              textFieldElement.classList.add("gredient-color-green");
              textFieldElement.value =
                remainingHour["hour"] + ":" + remainingHour["minute"];
              document.getElementById("h2-title-remainig").style.display =
                "block";
              document.getElementById("textFieldRemaining").style.display =
                "block";
            }
            if (currentHour > 12) {
              currentHour = currentHour - 12;
            }
            if (
              currentHour > leaveTimeResult["hour"] ||
              (currentHour >= leaveTimeResult["hour"] &&
                currentMinute >= leaveTimeResult["minute"])
            ) {
              document.getElementById("hurryTag").style.display = "block";
              document.getElementById("miss_punch_div").style.display = "none";
              document.getElementById("h2-title-remainig").style.display =
                "none";
              document.getElementById("textFieldRemaining").style.display =
                "none";
            }
            if (leaveTimeResult["hour"] >= 12) {
              leaveTimeResult["hour"] = leaveTimeResult["hour"] - 12;
              leaveTimeResult["hour"] === 0 && (leaveTimeResult["hour"] = 12);
              resultDetails["leaveHour"] = resultDetails["leaveHour"] - 12;
            }
            document.getElementById("h2-title").style.display = "block";
            let textFieldElement = document.getElementById("textField");
            textFieldElement.classList.remove("gredient-color-green");
            textFieldElement.classList.remove("gredient-color-red");
            textFieldElement.style.fontSize = "16px";
            if (resultDetails["leaveHour"] >= 07) {
              textFieldElement.classList.add("gredient-color-red");
            } else {
              textFieldElement.classList.add("gredient-color-green");
            }
            if (leaveTimeResult["hour"] < 10) {
              leaveTimeResult["hour"] = "0" + leaveTimeResult["hour"];
            }
            if (leaveTimeResult["minute"] < 10) {
              leaveTimeResult["minute"] = "0" + leaveTimeResult["minute"];
            }
            textFieldElement.value =
              leaveTimeResult["hour"] + ":" + leaveTimeResult["minute"];
            document.getElementById("entry-table").innerHTML =
              resultDetails["table"];
          }
        }
      );
    });
  } else {
    document.getElementById("textField").value = "Not supported url";
  }
});
