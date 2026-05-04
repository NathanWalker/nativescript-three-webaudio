import {
  bootstrapApplication,
  provideNativeScriptHttpClient,
  provideNativeScriptRouter,
  registerElement,
  runNativeScriptAngularApp,
} from "@nativescript/angular";
import { provideZonelessChangeDetection } from "@angular/core";
import { withInterceptorsFromDi } from "@angular/common/http";
import { routes } from "./app/app.routes";
import { AppComponent } from "./app/app.component";
import { Canvas } from "@nativescript/canvas";
import { Application, Utils } from "@nativescript/core";

Application.on("discardedError", (args) => {
  console.log("discardedError", args.error);
});

Application.on("uncaughtError", (args) => {
  console.log("uncaughtError", args.error);
});

registerElement("Canvas", () => Canvas);

if (__ANDROID__) {
  Application.android.on(
    Application.AndroidApplication.activityCreatedEvent,
    (args) => {
      Utils.android.enableEdgeToEdge(args.activity, {
        handleDarkMode(bar, resources) {
          return true;
        },
      });
    },
  );
}

try {
  runNativeScriptAngularApp({
    appModuleBootstrap: () => {
      return bootstrapApplication(AppComponent, {
        providers: [
          provideNativeScriptHttpClient(withInterceptorsFromDi()),
          provideNativeScriptRouter(routes),
          provideZonelessChangeDetection(),
        ],
      });
    },
  });
} catch (error) {
  console.error("Error bootstrapping the application:", error);
}
