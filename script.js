document.getElementById('reportForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const micName = document.getElementById('micName').value;
    const serialNo = document.getElementById('serialNo').value;
    const operator = document.getElementById('operator').value;
    const calDate = document.getElementById('calDate').value;
    const temperature = document.getElementById('temperature').value;
    const humidity = document.getElementById('humidity').value;
    const pressure = document.getElementById('pressure').value;
    const ocSensitivity = parseFloat(document.getElementById('ocSensitivity').value);
    const uncertainty = parseFloat(document.getElementById('uncertainty').value);
    const freqResponseData = document.getElementById('freqResponseData').value;
    
    document.getElementById('reportMicName1').innerText = micName;
    document.getElementById('reportMicName2').innerText = micName;
    document.getElementById('reportSerialNo').innerText = serialNo;
    document.getElementById('footerMicName').innerText = micName;
    document.getElementById('footerSerialNo').innerText = serialNo;
    document.getElementById('reportOperator').innerText = operator;
    document.getElementById('reportCalDate').innerText = calDate;
    document.getElementById('reportTemperature').innerText = temperature;
    document.getElementById('reportHumidity').innerText = humidity;
    document.getElementById('reportPressure').innerText = pressure;
    document.getElementById('reportOcSensitivity').innerText = ocSensitivity.toFixed(2);
    document.getElementById('reportUncertainty').innerText = `\u00B1${uncertainty.toFixed(2)}`;

    const ocDb = 20 * Math.log10(ocSensitivity / 1);
    document.getElementById('reportOcDb').innerText = ocDb.toFixed(2);

    const data = [];
    const lines = freqResponseData.trim().split('\n');
    
    for (const line of lines) {
        const parts = line.split(/[\t, ]+/).filter(p => p.length > 0);
        if (parts.length >= 2) {
            const freq = parseFloat(parts[0]);
            const db = parseFloat(parts[1]);
            if (!isNaN(freq) && !isNaN(db)) {
                data.push({ freq, db });
            }
        }
    }

    const freqTableBody = document.getElementById('freqTableBody');
    freqTableBody.innerHTML = '';
    const halfLength = Math.ceil(data.length / 2);
    for (let i = 0; i < halfLength; i++) {
        const row = document.createElement('tr');
        const rowData = data[i];
        const rowHtml = `
            <td>${rowData.freq}</td>
            <td>${rowData.db.toFixed(2)}</td>
            ${i + halfLength < data.length ? `
            <td>${data[i + halfLength].freq}</td>
            <td>${data[i + halfLength].db.toFixed(2)}</td>` : `
            <td></td>
            <td></td>`}
        `;
        row.innerHTML = rowHtml;
        freqTableBody.appendChild(row);
    }

    const graphLine = document.getElementById('graphLine');
    const yAxisGrid = document.getElementById('yAxisGrid');
    const xAxisGrid = document.getElementById('xAxisGrid');

    yAxisGrid.innerHTML = '';
    xAxisGrid.innerHTML = '';
    
    if (data.length > 0) {
        const graphWidth = 1000;
        const graphHeight = 250;
        
        const freqs = data.map(p => p.freq);
        const dbs = data.map(p => p.db);
        const minFreq = Math.min(...freqs);
        const maxFreq = Math.max(...freqs);
        const minDb = Math.min(...dbs);
        const maxDb = Math.ceil(Math.max(...dbs));
        
        const yMin = Math.floor(minDb) - 1;
        const yMax = Math.ceil(maxDb) + 1;
        
        const points = data.map(p => {
            const x = (Math.log10(p.freq) - Math.log10(minFreq)) / (Math.log10(maxFreq) - Math.log10(minFreq)) * graphWidth;
            const y = graphHeight - ((p.db - yMin) / (yMax - yMin)) * graphHeight;
            return `${x},${y}`;
        }).join(' ');

        graphLine.setAttribute('points', points);

        for (let dbValue = yMin; dbValue <= yMax; dbValue++) {
            const yPos = graphHeight - ((dbValue - yMin) / (yMax - yMin)) * graphHeight;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', yPos);
            line.setAttribute('x2', graphWidth);
            line.setAttribute('y2', yPos);
            line.setAttribute('stroke', '#ccc');
            line.setAttribute('stroke-width', '1');
            yAxisGrid.appendChild(line);

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', -10);
            label.setAttribute('y', yPos);
            label.setAttribute('fill', '#333');
            label.setAttribute('font-size', '15');
            label.setAttribute('dominant-baseline', 'middle');
            label.setAttribute('text-anchor', 'end');
            label.textContent = dbValue;
            yAxisGrid.appendChild(label);
        }

        const logStart = Math.log10(minFreq);
        const logEnd = Math.log10(maxFreq);
        
        for (let power = Math.floor(logStart); power <= Math.ceil(logEnd); power++) {
            const majorFreq = Math.pow(10, power);
            if (majorFreq >= minFreq && majorFreq <= maxFreq) {
                const xPos = (Math.log10(majorFreq) - logStart) / (logEnd - logStart) * graphWidth;
                
                const majorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                majorLine.setAttribute('x1', xPos);
                majorLine.setAttribute('y1', 0);
                majorLine.setAttribute('x2', xPos);
                majorLine.setAttribute('y2', graphHeight);
                majorLine.setAttribute('stroke', '#ccc');
                majorLine.setAttribute('stroke-width', '1');
                xAxisGrid.appendChild(majorLine);

                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', xPos);
                label.setAttribute('y', graphHeight + 20);
                label.setAttribute('fill', '#333');
                label.setAttribute('font-size', '15');
                label.setAttribute('text-anchor', 'middle');
                label.textContent = majorFreq >= 1000 ? `${majorFreq / 1000}k` : majorFreq;
                xAxisGrid.appendChild(label);
            }

            for (let multiplier of [2, 5]) {
                const minorFreq = multiplier * Math.pow(10, power);
                if (minorFreq > minFreq && minorFreq < maxFreq) {
                    const xPos = (Math.log10(minorFreq) - logStart) / (logEnd - logStart) * graphWidth;
                    
                    const minorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    minorLine.setAttribute('x1', xPos);
                    minorLine.setAttribute('y1', 0);
                    minorLine.setAttribute('x2', xPos);
                    minorLine.setAttribute('y2', graphHeight);
                    minorLine.setAttribute('stroke', '#e0e0e0');
                    minorLine.setAttribute('stroke-width', '0.5');
                    xAxisGrid.appendChild(minorLine);
                }
            }
        }
    }

    document.getElementById('reportContainer').classList.remove('hidden');
    document.getElementById('printBtn').style.display = 'block';
});

document.getElementById('printBtn').addEventListener('click', function() {
    window.print();
});