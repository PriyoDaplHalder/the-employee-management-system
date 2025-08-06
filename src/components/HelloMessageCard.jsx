import React from "react";
import { Card, Typography, Grid } from "@mui/material";

const getWindDirection = (degree) => {
  const directions = [
    "North",
    "North Northeast",
    "Northeast",
    "East Northeast",
    "East",
    "East Southeast",
    "Southeast",
    "South Southeast",
    "South",
    "South Southwest",
    "Southwest",
    "West Southwest",
    "West",
    "West Northwest",
    "Northwest",
    "North Northwest",
  ];
  const index = Math.round(degree / 22.5) % 16;
  return directions[index];
};

const HelloMessageCard = ({ user }) => {
  const [weather, setWeather] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [dateTime, setDateTime] = React.useState(new Date().toLocaleString());

  React.useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    const city = "Kolkata";
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.cod === 200) {
          setWeather(data);
        } else {
          setError("Weather data not available");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch weather");
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    const updateDateTime = () => {
      setDateTime(new Date().toLocaleString());
    };
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // the suffix after a date
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const currentDate = new Date();
  const weekday = currentDate.toLocaleDateString(undefined, {
    weekday: "long",
  });
  const month = currentDate.toLocaleDateString(undefined, { month: "long" });
  const day = currentDate.getDate();
  const year = currentDate.getFullYear();
  const formattedDate = `${weekday}, ${month} ${day}${getOrdinalSuffix(
    day
  )}, ${year}`;
  const timenow = dateTime.split(",")[1]?.trim() || "";

  return (
    <Card
      sx={{
        p: 4,
        backgroundColor: "#fdfdfd",
        borderRadius: 4,
        boxShadow: 2,
      }}
    >
      {loading ? (
        <Typography variant="body1">Please wait, loading...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={3} alignItems="center">
          {/* Left Content */}
          <Grid item xs={12} sm={8}>
            <Typography variant="h6" gutterBottom>
              Hello,{" "}
              <Typography component="span" color="primary" fontWeight={600}>
                {user.email?.split("@")[0] || "User"}
              </Typography>
              !
            </Typography>
            <Typography variant="body1" gutterBottom>
              It's <strong>{formattedDate}</strong>. The current time is{" "}
              <strong>{timenow}</strong>.
            </Typography>
            <Typography variant="body1" gutterBottom>
              Current weather in{" "}
              <Typography component="span" color="primary" fontWeight={600}>
                {weather.name}
              </Typography>{" "}
              is <em>{weather.weather[0].description}</em> with a temperature of{" "}
              <strong>{Math.round(weather.main.temp)}°C</strong> (feels like{" "}
              <strong>{Math.round(weather.main.feels_like)}°C</strong>).
            </Typography>
            <Typography variant="body1" gutterBottom>
              Humidity: <strong>{weather.main.humidity}%</strong>, Wind:{" "}
              <strong>{weather.wind.speed} km/h</strong> from the{" "}
              <strong>{getWindDirection(weather.wind.deg)}</strong>.
            </Typography>
          </Grid>
          {/* Weather Icon */}
          <Grid
            item
            xs={12}
            sm={4}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt={weather.weather[0].description}
              width={80}
              style={{
                borderRadius: "50%",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              }}
            />
            <Typography variant="caption" fontStyle="italic">
              {weather.weather[0].main}
            </Typography>
          </Grid>
        </Grid>
      )}
    </Card>
  );
};

export default HelloMessageCard;
