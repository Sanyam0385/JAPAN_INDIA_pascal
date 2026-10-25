const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

const newTranslations = {
  en: {
    admin: {
      fleetMap: "Fleet & Hotspots Map",
      allFleet: "All Fleet",
      collectorsOnly: "Collectors (Trucks)",
      pickersOnly: "Pickers (Carts)",
      complaintsOnly: "Complaints Only",
      hotspotsLayer: "Hotspots",
      hotspotsActive: "Hotspots Layer ON",
      staleWarning: "Inactive (>2 min)",
      liveFleetCount: "{{count}} Active Vehicles",
      civicBroadcast: "Broadcast Alert 📢",
      broadcastTitle: "Broadcast Civic Alert",
      broadcastDesc: "Send urgent detour or cleanliness advisory to municipal vehicles and collectors.",
      sendBroadcast: "Send Broadcast to Fleet",
      assignToWard: "Assign to Ward Crew",
      grievanceDetails: "Citizen Grievance",
      assignedSuccess: "Grievance assigned to Ward 151 Sanitation Crew",
      filterByWard: "Filter by Ward",
      activeTelemetries: "Active Telemetry Feed",
      hotspotLegend: "Waste Accumulation Hotspots",
      allWards: "All Wards",
      emergencyAlertDropped: "Civic broadcast alert placed at {{ward}}",
    }
  },
  hi: {
    admin: {
      fleetMap: "फ्लीट एवं हॉटस्पॉट मैप",
      allFleet: "संपूर्ण फ्लीट",
      collectorsOnly: "कलेक्टर (ट्रक)",
      pickersOnly: "कबाड़ी (ठेला)",
      complaintsOnly: "केवल शिकायतें",
      hotspotsLayer: "हॉटस्पॉट",
      hotspotsActive: "हॉटस्पॉट लेयर चालू",
      staleWarning: "निष्क्रिय (>2 मिनट)",
      liveFleetCount: "{{count}} सक्रिय वाहन",
      civicBroadcast: "प्रसारण अलर्ट 📢",
      broadcastTitle: "नागरिक अलर्ट प्रसारित करें",
      broadcastDesc: "सभी नगरपालिका वाहनों और संग्रहकर्ताओं को आपातकालीन सूचना भेजें।",
      sendBroadcast: "फ्लीट को अलर्ट भेजें",
      assignToWard: "वार्ड टीम को सौंपें",
      grievanceDetails: "नागरिक शिकायत",
      assignedSuccess: "शिकायत वार्ड 151 स्वच्छता टीम को सौंप दी गई",
      filterByWard: "वार्ड अनुसार फ़िल्टर",
      activeTelemetries: "सक्रिय टेलीमेट्री फ़ीड",
      hotspotLegend: "कचरा संचय हॉटस्पॉट",
      allWards: "सभी वार्ड",
      emergencyAlertDropped: "{{ward}} पर नागरिक प्रसारण अलर्ट जारी किया गया",
    }
  },
  pa: {
    admin: {
      fleetMap: "ਫਲੀਟ ਅਤੇ ਹੌਟਸਪੌਟ ਨਕਸ਼ਾ",
      allFleet: "ਸਾਰਾ ਫਲੀਟ",
      collectorsOnly: "ਕਲੈਕਟਰ (ਟਰੱਕ)",
      pickersOnly: "ਕਬਾੜੀਏ (ਰੇਹੜੀ)",
      complaintsOnly: "ਸਿਰਫ਼ ਸ਼ਿਕਾਇਤਾਂ",
      hotspotsLayer: "ਹੌਟਸਪੌਟ",
      hotspotsActive: "ਹੌਟਸਪੌਟ ਲੇਅਰ ਚਾਲੂ",
      staleWarning: "ਨਿਸ਼ਕਿਰਿਆ (>2 ਮਿੰਟ)",
      liveFleetCount: "{{count}} ਸਰਗਰਮ ਵਾਹਨ",
      civicBroadcast: "ਪ੍ਰਸਾਰਣ ਚੇਤਾਵਨੀ 📢",
      broadcastTitle: "ਨਾਗਰਿਕ ਚੇਤਾਵਨੀ ਪ੍ਰਸਾਰਿਤ ਕਰੋ",
      broadcastDesc: "ਸਾਰੇ ਨਗਰ ਨਿਗਮ ਵਾਹਨਾਂ ਅਤੇ ਕਲੈਕਟਰਾਂ ਨੂੰ ਐਮਰਜੈਂਸੀ ਸੁਨੇਹਾ ਭੇਜੋ।",
      sendBroadcast: "ਫਲੀਟ ਨੂੰ ਚੇਤਾਵਨੀ ਭੇਜੋ",
      assignToWard: "ਵਾਰਡ ਟੀਮ ਨੂੰ ਸੌਂਪੋ",
      grievanceDetails: "ਨਾਗਰਿਕ ਸ਼ਿਕਾਇਤ",
      assignedSuccess: "ਸ਼ਿਕਾਇਤ ਵਾਰਡ 151 ਸਵੱਛਤਾ ਟੀਮ ਨੂੰ ਸੌਂਪੀ ਗਈ",
      filterByWard: "ਵਾਰਡ ਅਨੁਸਾਰ ਫਿਲਟਰ",
      activeTelemetries: "ਸਰਗਰਮ ਟੈਲੀਮੈਟਰੀ ਫੀਡ",
      hotspotLegend: "ਕੂੜਾ ਇਕੱਠਾ ਹੋਣ ਦੇ ਹੌਟਸਪੌਟ",
      allWards: "ਸਾਰੇ ਵਾਰਡ",
      emergencyAlertDropped: "{{ward}} 'ਤੇ ਨਾਗਰਿਕ ਪ੍ਰਸਾਰਣ ਚੇਤਾਵਨੀ ਜਾਰੀ ਕੀਤੀ ਗਈ",
    }
  },
  ja: {
    admin: {
      fleetMap: "車両隊＆重点監視マップ",
      allFleet: "全車両隊",
      collectorsOnly: "収集車（トラック）",
      pickersOnly: "回収員（カート）",
      complaintsOnly: "苦情・通報のみ",
      hotspotsLayer: "重点監視エリア",
      hotspotsActive: "重点エリア表示中",
      staleWarning: "通信途絶（2分以上）",
      liveFleetCount: "{{count}} 台の車両が稼働中",
      civicBroadcast: "緊急一斉通知 📢",
      broadcastTitle: "行政アラートの一斉配信",
      broadcastDesc: "道路工事や収集ルート迂回などの緊急連絡を全収集隊へ送信します。",
      sendBroadcast: "収集隊へ一斉送信",
      assignToWard: "担当区の作業班へ割当",
      grievanceDetails: "市民通報の詳細",
      assignedSuccess: "第151区清掃作業班へ案件を割り当てました",
      filterByWard: "地区で絞り込み",
      activeTelemetries: "リアルタイム車両テレメトリ",
      hotspotLegend: "ごみ集積ホットスポット",
      allWards: "全地区",
      emergencyAlertDropped: "{{ward}} に行政警報ピンを配置しました",
    }
  }
};

for (const lang of ['en', 'hi', 'pa', 'ja']) {
  const filePath = path.join(localesDir, `${lang}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  if (!content.admin) content.admin = {};
  Object.assign(content.admin, newTranslations[lang].admin);

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
  console.log(`Updated ${lang}.json`);
}
