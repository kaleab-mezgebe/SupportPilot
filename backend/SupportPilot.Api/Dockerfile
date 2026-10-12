FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["backend/SupportPilot.Api/SupportPilot.Api.csproj", "backend/SupportPilot.Api/"]
RUN dotnet restore "backend/SupportPilot.Api/SupportPilot.Api.csproj"
COPY . .
WORKDIR "/src/backend/SupportPilot.Api"
RUN dotnet build "SupportPilot.Api.csproj" -c Release -o /app/build
RUN dotnet publish "SupportPilot.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "SupportPilot.Api.dll"]
