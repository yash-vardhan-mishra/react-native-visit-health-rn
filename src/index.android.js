import React, {useRef, useEffect, useState, useCallback} from 'react';

import {SafeAreaView, BackHandler, Platform} from 'react-native';
import {
  requestActivityRecognitionPermission,
  requestActivityData,
  requestLocationPermission,
  updateApiBaseUrl,
  handleMessage,
} from './VisitPluginAndroid';
import WebView from 'react-native-webview';


function getRunBeforeFirst(platform) {
  let runBeforeFirst = null;

  if (Platform.OS == 'android') {
    runBeforeFirst = `
        window.isNativeApp = true;
        window.platform = "ANDROID";
        window.setSdkPlatform('ANDROID');
        true; // note: this is required, or you'll sometimes get silent failures
    `;
  } else if (Platform.OS == 'ios') {
    runBeforeFirst = `
        window.isNativeApp = true;
        window.platform = "IOS";
        window.setSdkPlatform('IOS');
        true; // note: this is required, or you'll sometimes get silent failures
    `;
  }
  console.log('runBeforeFirst: ' + runBeforeFirst);

  return runBeforeFirst;
}

const HelloWorldApp = () => {
  const webviewRef = useRef(null);

  const runBeforeStart = getRunBeforeFirst(Platform.OS);

  const [canGoBack, setCanGoBack] = useState(false);

  const handleBack = useCallback(() => {
    if (canGoBack && webviewRef.current) {
      webviewRef.current.goBack();
      return true;
    }
    return false;
  }, [canGoBack]);

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBack);
    };
  }, [handleBack]);

  return (
    <SafeAreaView style={{flex: 1}}>
      <WebView
        ref={webviewRef}
        source={{
          uri: 'https://star-health.getvisitapp.xyz/login',
          headers: {
            platform: 'ANDROID',
          },
        }}
        onMessage={event => handleMessage(event, webviewRef)}
        injectedJavaScriptBeforeContentLoaded={runBeforeStart}
        javaScriptEnabled={true}
        onLoadProgress={event => setCanGoBack(event.nativeEvent.canGoBack)}
      />
    </SafeAreaView>
  );
};

export default HelloWorldApp;
