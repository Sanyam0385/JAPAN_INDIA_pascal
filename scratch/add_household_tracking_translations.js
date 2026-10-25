const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

const newTranslations = {
  en: {
    household: {
      trackLive: "Track Live 🧭",
      trackCollector: "Track Municipal Truck",
      trackPicker: "Track Doorstep Picker",
      liveTrackingTitle: "Live Doorstep Tracking",
      arrivingIn: "Arriving in {{time}}",
      distanceAway: "{{distance}} away",
      proximityAlertTitle: "Collector Approaching! (< 500m)",
      proximityAlertBody: "Your collection vehicle is within 500m. Please place your segregated bins at your doorstep.",
      collectorOffline: "Live Location Inactive",
      collectorOfflineSub: "Worker is currently between stops or offline. Displaying estimated route.",
      callWorker: "Call Worker",
      messageWorker: "Message",
      collectionType: "Collection Details",
      doorstepAddress: "Your Doorstep",
      vehicleReg: "Vehicle: {{reg}}",
      privacyNotice: "Live GPS is shared only during active shifts to respect municipal worker privacy.",
      liveGpsPill: "Live GPS Active",
      offlineEstimatePill: "Scheduled Estimate",
    }
  },
  hi: {
    household: {
      trackLive: "लाइव ट्रैक करें 🧭",
      trackCollector: "नगर निगम वाहन ट्रैक करें",
      trackPicker: "कबाड़ी / संग्रहकर्ता ट्रैक करें",
      liveTrackingTitle: "लाइव डोरस्टेप ट्रैकिंग",
      arrivingIn: "{{time}} में पहुंच रहे हैं",
      distanceAway: "{{distance}} दूर",
      proximityAlertTitle: "कलेक्टर पास आ रहा है! (< 500 मी)",
      proximityAlertBody: "कलेक्शन वाहन 500 मीटर के भीतर है। कृपया अपने अलग-अलग किए गए डिब्बे दरवाजे पर रखें।",
      collectorOffline: "लाइव लोकेशन निष्क्रिय",
      collectorOfflineSub: "कर्मचारी अभी रास्ते में है या ऑफलाइन है। अनुमानित मार्ग दिखाया जा रहा है।",
      callWorker: "कॉल करें",
      messageWorker: "संदेश भेजें",
      collectionType: "संग्रह विवरण",
      doorstepAddress: "आपका पता",
      vehicleReg: "वाहन: {{reg}}",
      privacyNotice: "गोपनीयता के लिए लाइव जीपीएस केवल सक्रिय ड्यूटी के दौरान ही साझा किया जाता है।",
      liveGpsPill: "लाइव जीपीएस सक्रिय",
      offlineEstimatePill: "अनुमानित समय",
    }
  },
  pa: {
    household: {
      trackLive: "ਲਾਈਵ ਟਰੈਕ ਕਰੋ 🧭",
      trackCollector: "ਨਗਰ ਨਿਗਮ ਵਾਹਨ ਟਰੈਕ ਕਰੋ",
      trackPicker: "ਕੂੜਾ ਚੁੱਕਣ ਵਾਲੇ ਨੂੰ ਟਰੈਕ ਕਰੋ",
      liveTrackingTitle: "ਲਾਈਵ ਡੋਰਸਟੈਪ ਟਰੈਕਿੰਗ",
      arrivingIn: "{{time}} ਵਿੱਚ ਪਹੁੰਚ ਰਹੇ ਹਨ",
      distanceAway: "{{distance}} ਦੂਰ",
      proximityAlertTitle: "ਕਲੈਕਟਰ ਨੇੜੇ ਆ ਰਿਹਾ ਹੈ! (< 500 ਮੀ)",
      proximityAlertBody: "ਕਲੈਕਸ਼ਨ ਵਾਹਨ 500 ਮੀਟਰ ਦੇ ਦਾਇਰੇ ਵਿੱਚ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਵੱਖਰੇ ਕੂੜੇਦਾਨ ਬਾਹਰ ਰੱਖੋ।",
      collectorOffline: "ਲਾਈਵ ਲੋਕੇਸ਼ਨ ਬੰਦ",
      collectorOfflineSub: "ਕਰਮਚਾਰੀ ਇਸ ਸਮੇਂ ਰਸਤੇ ਵਿੱਚ ਜਾਂ ਆਫਲਾਈਨ ਹੈ। ਅਨੁਮਾਨਿਤ ਰੂਟ ਦਿਖਾਇਆ ਜਾ ਰਿਹਾ ਹੈ।",
      callWorker: "ਕਾਲ ਕਰੋ",
      messageWorker: "ਸੁਨੇਹਾ ਭੇਜੋ",
      collectionType: "ਕਲੈਕਸ਼ਨ ਵੇਰਵੇ",
      doorstepAddress: "ਤੁਹਾਡਾ ਪਤਾ",
      vehicleReg: "ਵਾਹਨ: {{reg}}",
      privacyNotice: "ਨਿੱਜਤਾ ਲਈ ਲਾਈਵ ਜੀਪੀਐਸ ਸਿਰਫ਼ ਡਿਊਟੀ ਦੌਰਾਨ ਹੀ ਸਾਂਝਾ ਕੀਤਾ ਜਾਂਦਾ ਹੈ।",
      liveGpsPill: "ਲਾਈਵ ਜੀਪੀਐਸ ਚਾਲੂ",
      offlineEstimatePill: "ਅਨੁਮਾਨਿਤ ਸਮਾਂ",
    }
  },
  ja: {
    household: {
      trackLive: "リアルタイム追跡 🧭",
      trackCollector: "収集車を追跡",
      trackPicker: "回収担当者を追跡",
      liveTrackingTitle: "リアルタイム収集追跡",
      arrivingIn: "到着まで約 {{time}}",
      distanceAway: "現在地から {{distance}}",
      proximityAlertTitle: "まもなく収集車が到着します（500m以内）",
      proximityAlertBody: "収集車が接近しています。分別したごみを玄関前に準備してください。",
      collectorOffline: "リアルタイム位置情報オフ",
      collectorOfflineSub: "現在オフラインまたは移動中です。予定ルートを表示しています。",
      callWorker: "電話する",
      messageWorker: "メッセージ",
      collectionType: "収集の詳細",
      doorstepAddress: "ご自宅の玄関先",
      vehicleReg: "車両番号: {{reg}}",
      privacyNotice: "収集員のプライバシー保護のため、業務時間外は位置情報を共有しません。",
      liveGpsPill: "リアルタイムGPS通信中",
      offlineEstimatePill: "予定時刻目安",
    }
  }
};

for (const lang of ['en', 'hi', 'pa', 'ja']) {
  const filePath = path.join(localesDir, `${lang}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  if (!content.household) content.household = {};
  Object.assign(content.household, newTranslations[lang].household);

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
  console.log(`Updated ${lang}.json`);
}
