# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Сброс локального тестового окружения

Чтобы удалить локальный Expo-кэш и сохранённый seed тестовых данных, не затрагивая исходники, выполните:

```bash
npm run reset-project
```

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Игровые экраны и тестовые данные

Главная вкладка, «Еда» и «Магазин» собраны на игровых компонентах из `src/game`. Исходные графические материалы из макетов разложены по `src/assets/game`: комнаты, персонажи, продукты по категориям, UI и папка `reference` с контрольными состояниями макета.

После `npm install` проект добавляет локальному Expo CLI поддерживаемый проектом флаг:

```bash
npx expo start --test-data
```

При первом таком запуске создаётся случайный seed в `.expo/finny-test-data.json`. На его основе детерминированно создаются имя игрока и питомца, цвет питомца, монеты, серия входов, сытость, содержимое инвентаря и предварительно выбранные товары магазина. Fast Refresh сохраняет состояние текущей тестовой сессии, а новый запуск `npx expo start --test-data` снова подставляет тот же детерминированный набор исходных mock-значений. Для нового набора используйте `npx expo start --test-data --new-test-data`, а для воспроизводимого сценария — `npx expo start --test-data --test-seed demo-01`.

Глобальную реплику можно вызвать из любого триггера:

```ts
import { showGameDialog } from '@/game/services/dialogService';
showGameDialog('Текст сообщения', { title: 'Заголовок' });
```
