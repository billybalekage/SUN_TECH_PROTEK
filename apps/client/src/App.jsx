import Header from "./components/layout/header";
import { Theme, ThemeProvider } from "./components/layout/theme";
import Router from "./app/route";

const App = () => {
  return (
    <ThemeProvider>
      <Theme>
        <Header />
        <Router />
      </Theme>
    </ThemeProvider>
  );
};

export default App;
