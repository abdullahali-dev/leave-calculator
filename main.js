var retirementDate = null;

document.addEventListener("DOMContentLoaded", function () {
    retirementDate = moment();
    document.querySelector('#retirementDate').value = retirementDate.format("iYYYY-iMM-iDD");
    // initialize Hijri datepicker in "عدد الايام" tab
    initHijriDatepicker();
    // initialize theme toggle
    initThemeToggle();
});

function calc() {
    setResult();
    if (!checkInputs()) return;
    let oldRemaining = Number(document.querySelector('#oldRemaining').value)
    const vacations = parseInputAsArrayOfObjects();

    for (let i = 0; i < vacations.length; i++) {
        let start = null;
        let end = null;
        if (i == 0) {
            start = moment('1439-07-02', 'iYYYY-iMM-iDD');
            end = vacations[i].startDate;
        }
        /*
        else if (i == vacations.length - 1) {
            start = vacations[i].startDate
            end = retirementDate;
        }
        */
        else {
            start = vacations[i - 1].startDate
            end = vacations[i].startDate;
        }
        const days = end.diff(start, "days");
        console.log('s:', start.format('Y-M-D'), 'e:', end.format('Y-M-D'), 'd:', days)

        vacations[i].available = roundToTwo((vacations[i].available ?? 0) + roundToTwo(days * 0.1))
        vacations[i].remaining = roundToTwo(vacations[i].available - vacations[i].vacation);
        if (vacations[i].remaining > 0) {
            if (i < vacations.length - 1) {
                vacations[i + 1].available = vacations[i].remaining;
            }
            vacations[i].fromRemaining = vacations[i].vacation;
            vacations[i].fromOldRemaining = 0;
        } else {
            vacations[i].fromRemaining = vacations[i].available;
            vacations[i].fromOldRemaining = Math.abs(vacations[i].remaining);
            vacations[i].remaining = 0;
        }
        oldRemaining -= vacations[i].fromOldRemaining;
        vacations[i].oldRemaining = roundToTwo(oldRemaining);

    }
    console.table(vacations.map(x => {
        return {
            ...x,
            startDate: x.startDate.format('iYYYY-iMM-iDD')
        }
    }));
    setResult(vacations);
}

function setResult(vacations) {
    const resTblBody = document.querySelector('#resTblBody');
    resTblBody.innerHTML = '';
    if (!vacations)
        return;

    const lastVacation = vacations[vacations.length - 1];
    let compensation = lastVacation.remaining > 72 ? 72 : lastVacation.remaining;
    const finalCompensation = roundToTwo(compensation + lastVacation.oldRemaining > 180 ? 180 : lastVacation.oldRemaining + compensation);

    let idx = 0;
    vacations.forEach(x => {
        const isRetirementRow = vacations.length - 1 == idx;
        resTblBody.innerHTML += `
                    <tr class="${isRetirementRow ? 'table-success' : ''}">
                        <td>${x.startDate.format('iYYYY-iMM-iDD')}</td>
                        <td>${isRetirementRow ? 'تقاعد' : x.vacation}</td>
                        <td>${x.available}</td>
                        <td>${x.fromRemaining}</td>
                        ${isRetirementRow && x.remaining > 72 ? `<td><span class="text-decoration-line-through">${x.remaining}</span> 72</td>`
                : `<td>${x.remaining}</td>`}
                        <td>${x.fromOldRemaining}</td>
                        ${isRetirementRow && ((x.oldRemaining + compensation) - 180 > 0)
                ? `<td><span class="text-decoration-line-through">${x.oldRemaining}</span> ${finalCompensation - compensation} </td>`
                : `<td>${x.oldRemaining}</td>`}
                    </tr>
                `;
        idx++;
    })


    resTblBody.innerHTML += `
                <tr>
                    <th colspan="5">التعويض</th>
                    <td colspan="2">${finalCompensation}</td>
                </tr>
            `;
}
function roundToTwo(num) {
    return +(Math.round(num + "e+2") + "e-2");
}

function checkInputs() {
    setError('');
    if (!retirementDateChanged(document.querySelector('#retirementDate').value))
        return false;

    if (!document.querySelector('#oldRemaining').value) {
        setError('يجب إدخال الرصيد السابق');
        return;
    }

    const input = document.querySelector('#tblInput').value.trim();
    if (!input) {
        setError('يجب إدخال الإجازات');
        return false;
    }
    const rows = input.split('\n');
    if (rows.length == 0) {
        setError('تأكد من صيغة البيانات المدخله');
        return false;
    }
    if (!rows.every(x => {
        const cols = x.split('\t');
        if (cols.length != 5 || !moment.isMoment(parseHijriIfDate(cols[2])) || isNaN(cols[4]))
            return false;

        return true;
    })) {
        setError(
            `يجب أن يكون العمود الثالث بداية الإجازة(تاريخ) والعمود الخامس المدة (رقم)
                    <br>
                    مثال:
                    <br>
                    <textarea class="form-control disabled" disabled>2	إجازة عادية	1443/03/20	1444/03/21	2</textarea>
                    `);
        return false;
    }
    return true;
}
function parseInputAsArrayOfObjects() {
    const input = document.querySelector('#tblInput').value;

    const rawRows = input.split('\n');
    const headersArray = [
        "index",
        "type",
        "startDate",
        "endDate",
        "vacation"
    ];

    let output = [
        /*
            {
                index: -1,
                type: '-',
                startDate: moment('1439-07-02', 'iYYYY-iMM-iDD'),
                endDate: moment('1439-07-02', 'iYYYY-iMM-iDD'),
                vacation: 0
            }
        */
    ];
    for (let i = 0; i < rawRows.length; i++) {
        const values = rawRows[i].split('\t').map(value => value.trim());

        if (values.length <= 1 && values[0] === '') continue;

        const rowObject = {
            idx: i
        };
        headersArray.forEach((header, index) => {
            const val = values[index] !== undefined ? values[index] : '';
            if (!isNaN(val)) {
                rowObject[header] = Number(val);
            }
            else {
                rowObject[header] = parseHijriIfDate(val);
            }

        });
        output.push(rowObject);
    }
    output.push(
        {
            index: -2,
            type: '-',
            startDate: retirementDate,
            endDate: retirementDate,
            vacation: 0
        }
    )
    /*
*/
    output = output.sort((a, b) => a.startDate.diff(b.startDate));
    console.log(output.map(x => x.startDate.format('YYYY-MM')));

    return output;
}

function parseHijriIfDate(value) {
    if (value == null) return value;
    if (typeof value !== "string") return value;

    const original = value;
    let s = value.trim();

    s = s.replace(/هـ/g, "").trim();
    s = s.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

    if (!/^\d{4}[\s\/\\.-]+\d{1,2}[\s\/\\.-]+\d{1,2}$/.test(s)) {
        return original;
    }

    s = s.replace(/[\/\\.\s]+/g, "-").replace(/-+/g, "-");

    const m = moment(s, ["iYYYY-iMM-iDD"]);

    return m.isValid() ? m : original;
}

function retirementDateChanged(val) {
    setError('');
    if (!/^\d{4}[\s\/\\.-]+\d{1,2}[\s\/\\.-]+\d{1,2}$/.test(val)) {
        setError('أدخل التاريخ بالصيغة 01-01-1400');
        return false;
    }
    const momentDate = moment(val, ['iYYYY-iMM-iDD', 'iYYYY/iMM/iDD']);
    if (!momentDate.isValid()) {
        setError('التاريخ غير صحيح')
        return false;
    }
    retirementDate = momentDate;
    return true;
}

function setError(error) {
    document.querySelector('#error').innerHTML = error;
}

// Hijri datepicker and days counter for "عدد الايام"
function initHijriDatepicker() {
    function createPicker(prefix) {
        const y = document.getElementById(prefix + 'Year');
        const m = document.getElementById(prefix + 'Month');
        const d = document.getElementById(prefix + 'Day');
        const btn = document.getElementById(prefix + 'Today');
        if (!y || !m || !d) return null;

        const currentIYear = moment().iYear();
        // populate years if empty
        if (y.options.length === 0) {
            for (let yr = 1400; yr <= currentIYear; yr++) {
                const opt = document.createElement('option');
                opt.value = yr;
                opt.text = yr;
                y.appendChild(opt);
            }
        }
        if (m.options.length === 0) {
            for (let mo = 1; mo <= 12; mo++) {
                const opt = document.createElement('option');
                opt.value = mo;
                opt.text = mo;
                m.appendChild(opt);
            }
        }
        // helper to set days according to selected month
        function adjustDays() {
            const iy = Number(y.value);
            const im = Number(m.value);
            const daysInMonth = moment(`${iy}-${im}-1`, 'iYYYY-iM-iD').iDaysInMonth();
            const selected = Number(d.value) || 1;
            d.innerHTML = '';
            for (let dd = 1; dd <= daysInMonth; dd++) {
                const opt = document.createElement('option');
                opt.value = dd;
                opt.text = dd;
                d.appendChild(opt);
            }
            d.value = Math.min(selected, daysInMonth);
        }

        y.addEventListener('change', adjustDays);
        m.addEventListener('change', adjustDays);

        if (btn) btn.addEventListener('click', function () {
            const now = moment();
            y.value = now.iYear();
            m.value = now.iMonth() + 1;
            adjustDays();
            d.value = Math.min(now.iDate(), d.options.length);
        });

        // defaults to today
        const now = moment();
        y.value = now.iYear();
        m.value = now.iMonth() + 1;
        adjustDays();
        d.value = Math.min(now.iDate(), d.options.length);

        return {
            getMoment() {
                const iy = String(Number(y.value)).padStart(4, '0');
                const im = String(Number(m.value)).padStart(2, '0');
                const id = String(Number(d.value)).padStart(2, '0');
                return moment(`${iy}-${im}-${id}`, 'iYYYY-iMM-iDD');
            }
        };
    }

    const startPicker = createPicker('hijriStart');
    const endPicker = createPicker('hijriEnd');

    const countBtn = document.getElementById('countDaysBtn');
    const err = document.getElementById('daysCountError');
    const summary = document.getElementById('daysCountSummary');
    const tbody = document.getElementById('daysCountTable');

    function clearResults() {
        if (err) err.textContent = '';
        if (summary) summary.textContent = '—';
        if (tbody) tbody.innerHTML = '';
    }

    function countDays() {
        clearResults();
        if (!startPicker || !endPicker) return;
        let s = startPicker.getMoment();
        let e = endPicker.getMoment();
        const includeStartCheckbox = document.getElementById('includeStart');
        const includeEndCheckbox = document.getElementById('includeEnd');
        const includeStart = includeStartCheckbox ? includeStartCheckbox.checked : true;
        const includeEnd = includeEndCheckbox ? includeEndCheckbox.checked : true;

        if (!s.isValid() || !e.isValid()) {
            if (err) err.textContent = 'التاريخ غير صالح';
            return;
        }
        // ensure s <= e
        if (s.isAfter(e)) {
            const tmp = s; s = e; e = tmp;
        }

        // determine first and last moments to include in segments
        const firstMomentForSegments = includeStart ? s.clone() : s.clone().add(1, 'days');
        const lastMomentForSegments = includeEnd ? e.clone() : e.clone().subtract(1, 'days');

        // calculate total days based on chosen inclusions
        let totalDays = 0;
        if (!lastMomentForSegments.isBefore(firstMomentForSegments)) {
            totalDays = lastMomentForSegments.diff(firstMomentForSegments, 'days') + 1;
        }

        const modeText = `${includeStart ? 'شامل بداية' : 'غير شامل بداية'} / ${includeEnd ? 'شامل نهاية' : 'غير شامل نهاية'}`;
        if (summary) summary.textContent = `العدد الإجمالي للأيام (${modeText}): ${totalDays}`;

        tbody.innerHTML = '';

        // render month-by-month rows only if there are days
        if (totalDays > 0) {
            // iterate months from firstMomentForSegments's month to lastMomentForSegments's month
            let curYear = Number(firstMomentForSegments.format('iYYYY'));
            let curMonth = Number(firstMomentForSegments.format('iMM'));
            const endMonthKey = lastMomentForSegments.format('iYYYY-iMM');

            while (true) {
                const monthStart = moment(`${String(curYear).padStart(4, '0')}-${String(curMonth).padStart(2, '0')}-01`, 'iYYYY-iMM-iDD');
                const daysInMonth = monthStart.iDaysInMonth();
                const monthEnd = moment(`${String(curYear).padStart(4, '0')}-${String(curMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`, 'iYYYY-iMM-iDD');

                const segStart = firstMomentForSegments.isAfter(monthStart) ? firstMomentForSegments.clone() : monthStart.clone();
                const segEndCandidate = lastMomentForSegments.isBefore(monthEnd) ? lastMomentForSegments.clone() : monthEnd.clone();

                if (!segEndCandidate.isBefore(segStart)) {
                    const segDays = segEndCandidate.diff(segStart, 'days') + 1;
                    // append row
                    tbody.innerHTML += `
                        <tr>
                            <td>${monthStart.format('iYYYY-iMM')}</td>
                            <td>${segStart.format('iYYYY-iMM-iDD')}<br><small>${segStart.format('YYYY-MM-DD')}</small></td>
                            <td>${segEndCandidate.format('iYYYY-iMM-iDD')}<br><small>${segEndCandidate.format('YYYY-MM-DD')}</small></td>
                            <td>${segDays}</td>
                        </tr>
                    `;
                }

                // stop if this is the last month to show
                if (monthStart.format('iYYYY-iMM') === endMonthKey) break;

                // increment month
                if (curMonth === 12) {
                    curMonth = 1;
                    curYear += 1;
                } else {
                    curMonth += 1;
                }
            }
        }

        // append final summary row (shows effective first/last used and total days)
        tbody.innerHTML += `
            <tr class="table-secondary">
                <th>الإجمالي</th>
                <td>${firstMomentForSegments.format('iYYYY-iMM-iDD')}<br><small>${firstMomentForSegments.format('YYYY-MM-DD')}</small></td>
                <td>${lastMomentForSegments.format('iYYYY-iMM-iDD')}<br><small>${lastMomentForSegments.format('YYYY-MM-DD')}</small></td>
                <td>${totalDays}</td>
            </tr>
        `;
    }

    if (countBtn) countBtn.addEventListener('click', countDays);
}

// Theme toggle (persisted)
function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    const root = document.documentElement;
    const body = document.body;
    const stored = localStorage.getItem('theme');
    const defaultTheme = stored || root.getAttribute('data-bs-theme') || (body ? body.getAttribute('data-bs-theme') : null) || 'dark';

    function applyTheme(theme) {
        root.setAttribute('data-bs-theme', theme);
        if (body) body.setAttribute('data-bs-theme', theme);
        try { localStorage.setItem('theme', theme); } catch (e) { }
        if (btn) {
            btn.textContent = `${theme === 'dark' ? 'دارك' : 'لايت'}`;
            btn.classList.toggle('btn-outline-light', theme === 'dark');
            btn.classList.toggle('btn-outline-dark', theme === 'light');
        }
    }

    applyTheme(defaultTheme);

    if (btn) {
        btn.addEventListener('click', function () {
            const current = root.getAttribute('data-bs-theme') || 'dark';
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });
    }
}
