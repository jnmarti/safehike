from google.adk.agents.llm_agent import Agent
from google.adk.agents import ParallelAgent, SequentialAgent
from google.adk.tools import google_search
from google.adk.tools.tool_context import ToolContext
from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmResponse, LlmRequest
from fastapi import FastAPI
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint
from dotenv import load_dotenv
from pydantic import BaseModel, Field


load_dotenv()


llm = 'gemini-2.5-flash'


def set_mountain(tool_context: ToolContext, mountain: str):
    """
    Tool to record and save the mountain the user is going to hike.

    Args:
        mountain: The name of the mountain (in japanese)
    """
    tool_context.state["mountain"] = mountain
    return {"status": "success"}

def set_hiking_dates(tool_context: ToolContext, hiking_dates: list[str]):
    """
    Tool to record and save the hiking dates of the user's hike.

    Args:
        hiking_dates: The list of hiking dates in 'YYYY-MM-DD' format.
    """
    tool_context.state["hiking_dates"] = hiking_dates
    return {"status": "success"}

def get_current_date():
    from datetime import datetime
    return datetime.now().strftime('%Y-%m-%d')

def initialize_hiking_context(callback_context: CallbackContext, llm_request: LlmRequest) -> LlmResponse:
    callback_context.state["trail"] = None
    callback_context.state["current_date"] = get_current_date()


class WeatherReportItem(BaseModel):
    date: str = Field(..., description="The date of the weather forecast in 'YYYY-MM-DD' format.")
    max_temperature: str = Field(..., description="The maximum temperature forecasted for the day.")
    min_temperature: str = Field(..., description="The minimum temperature forecasted for the day.")
    precipitation_probability: str = Field(..., description="The probability of precipitation for the day.")
    wind_speed: str = Field(..., description="The wind speed forecasted for the day.")


class Risk(BaseModel):
    name: str = Field(..., description="The name of the risk.")
    emoji: str = Field(..., description="The emoji that represents the risk.")

class RiskAnalysisItem(BaseModel):
    risk: Risk = Field(..., description="The risk item.")
    relevance: str = Field(..., description="A brief explanation of the relevance of the risk to the hike.")
    recommendations: str = Field(..., description="Recommendations on how to mitigate that risk during the hike.")

class TrailInfoItem(BaseModel):
    name: str = Field(..., description="The name of the trail.")
    difficulty_level: str = Field(..., description="The difficulty level of the trail.")
    estimated_ascent_time: str = Field(..., description="The estimated ascent hiking time for the trail.")
    estimated_descent_time: str = Field(..., description="The estimated descent hiking time for the trail.")

class LinksItem(BaseModel):
    title: str = Field(..., description="The title of the link.")
    url: str = Field(..., description="The URL of the link.")

class HikingReport(BaseModel):
    summary: str = Field(..., description="A brief summary of the hiking report in markdown format.")
    risk_emojis: list[str] = Field(..., description="A list of the emojis that represent the risks identified for this hike. There are five risks you must consider: 熊（🐻）, 高山病（🧠）, 強風（🌬️）, 低体温症（🥶）, 滑落（🤕）")
    weather_report: list[WeatherReportItem] = Field(..., description="A summary of the weather forecast for the hiking dates.")
    relevant_news: list[str] = Field(..., description="A list of the relevant news that may impact hiking safety. Each item should be in markdown format.")
    trails_info: list[TrailInfoItem] = Field(..., description="A list of trails relevant to the hike, each with its difficulty level and estimated hiking times.")
    risk_analysis: list[RiskAnalysisItem] = Field(
        ...,
        description="""
       - Analysis of potential risks based on weather and news information. The following is a list of the risks you must consider:
        熊（🐻）, 高山病（🧠）, 強風（🌬️）, 低体温症（🥶）, 滑落（🤕）
        Please include only the risks that are relevant to the hiking conditions.
        For each of the risks include:
        1) a brief explanation of the relevance of the risk to the hike
        2) recommendations on how to mitigate that risk during the hike
        Example:

        滑落
        2月は積雪や凍結路面が予想されており、特に「403段の石段」や「石割神社から山頂への急登」は滑りやすくなるため、転倒や滑落のリスクが高いです。
        対策: 冬用の登山靴、防水・透湿性のあるアウターシェル、保温性の高いミドルレイヤー、ベースレイヤーによる重ね着を徹底する。温かい飲み物など、十分な水分と行動食を携行する。汗をかきすぎないよう、こまめな着脱で体温を調節する。
        """,
    )
    links: list[LinksItem] = Field(..., description="A list of relevant links for the hike.")

weather_agent = Agent(
    model=llm,
    name='weather_agent',
    description='A mountain weather forecasts report agent.',
    instruction="You are part of a hiking guide team. Your team is in charge of providing safe hiking advice."
    "The user is planning to hike according to the following details:"
    "Mountain: {mountain}"
    "Hiking Dates: {hiking_dates}"
    "Your role is to provide weather forecasts for the target mountain and the dates of the hike."
    "You must use the `google_search` tool to look up the weather forecast for that mountain on that date."
    "Please use information from the `https://weathernews.jp/mountain/` when obtaining weather data. Provide the user a link to the relevant weather page."
    "Be brief and concise in your responses."
    "The current date is {current_date}."
    "Your output must be in Japanese.",
    tools=[google_search],
    output_key="weather_report",
    include_contents="none",
)

news_agent = Agent(
    model=llm,
    name="news_agent",
    description="A mountain news report agent.",
    instruction="You are part of a hiking guide team. Your team is in charge of providing safe hiking advice."
    "The user is planning to hike according to the following details:"
    "Mountain: {mountain}"
    "Hiking Dates: {hiking_dates}"
    "Your role is to provide recent news about the target mountain that may affect hiking safety."
    "News should include the following topics: recent accidents, trail closures, wildlife activity, and any other relevant information."
    "You must use the `google_search` tool to look up for news that may be relevant to that mountain and the dates of the hike."
    "Be brief and concise in your responses."
    "The current date is {current_date}."
    "Your output must be in Japanese.",
    tools=[google_search],
    output_key="news_report",
    include_contents="none",
)

trail_agent = Agent(
    model=llm,
    name='trail_agent',
    description='A mountain trail research agent.',
    instruction="You are part of a hiking guide team. Your team is in charge of providing safe hiking advice."
    "The user is planning to hike according to the following details:"
    "Mountain: {mountain}"
    "Hiking Dates: {hiking_dates}"
    "We have collected the following information relevant to the hike:"
    "**Weather:** {weather_report}"
    "**News:** {news_report}"
    "Your role is to provide the user with information about the trails on the target mountain."
    "Many mountains can be hiked from different trails. Trails may have different difficulty levels, conditions, and safety considerations."
    "Some trails may be unavailable due to weather conditions, events, or maintenance."
    "The user mentioned they want to hike the following trail: {trail}"
    "If the trails equals `None`, it means the user has not specified any trail preference."
    "In that case, your job is to provide the user with a brief overview of the different mountain trails that are relevant to their hike."
    "Provide a list of the trails, along with their difficulty level, estimated hiking time, and a list of safety considerations for each trail."
    "The hiking time information must be disaggregated into ascent time and descent time, as well as rest time."
    "Otherwise (the user has specified a trail), your job is to provide detailed information about that specific trail."
    "Provide information about the difficulty level, estimated hiking time (ascent, descent, rest), and a list of safety considerations for that trail,"
    "taking into account the weather and news information already collected."
    "In all cases, use the `google_search` tool to look up information about the trails on the target mountain."
    "The current date is {current_date}."
    "Your output must be in Japanese.",
    tools=[google_search],
    output_key="trail_report",
    include_contents="none",
)

aggregator_agent = Agent(
    model=llm,
    name='aggregator_agent',
    description='Hiking info aggregator.',
    instruction="""You are part of a hiking guide team. Your team is in charge of providing safe hiking advice.
    Your role is to generate a hiking report based on the weather information and recent news provided by your teammates:

    **Mountain:**
    {mountain}

    **Hiking Dates:**
    {hiking_dates}

    **Weather Report:**
    {weather_report}

    **Trail Report:**
    {trail_report}

    **News Report:**
    {news_report}

    **Important Links:**
    {info_links}
           
    Be brief and concise in your responses.
    The current date is {current_date}.
    The report must be written in Japanese.
    """,
    output_key="hiking_report",
    output_schema=HikingReport,
)

links_agent = Agent(
    model=llm,
    name='links_agent',
    description='Hiking info links extractor.',
    instruction="You are part of a hiking guide team. Your team is in charge of providing safe hiking advice."
    "The user is planning to hike according to the following details:"
    "Mountain: {mountain}"
    "Hiking Dates: {hiking_dates}"
    "Your role is to find the links to websites that are important for the hike."
    "This includes links to official mountain websites, trail information pages, emergency information and any other relevant resources."
    "Search for the mountain in yamap.com and add the link to your list."
    "Your output should be a list of URLs and their titles in markdown format."
    "The current date is {current_date}.",
    output_key="info_links",
    tools=[google_search],
    include_contents="none",
)

research_team = ParallelAgent(
    name='research_team',
    sub_agents=[weather_agent, news_agent, links_agent],
)

workflow = SequentialAgent(
    name='workflow',
    sub_agents=[research_team, trail_agent, aggregator_agent],
)

root_agent = Agent(
    name="root_agent",
    model=llm,
    description="Safe Hike Planning Agent",
    instruction="You are a Safe Hike Planning Agent. Your task is to help users plan safe hiking trips by gathering necessary information and providing recommendations."
    "First, use the `set_mountain` and `set_hiking_dates` tools to record the mountain and hiking dates provided by the user."
    "Then, delegate the task of researching weather forecasts and recent news to your workflow agent."
    "Finally, compile the information into a comprehensive hiking report for the user."
    "Important: the dates provided by the user are relative to the current date. For example, if someone says that they will hike on June 4th, they mean June 4th of the current year."
    "Your output must be in Japanese.",
    tools=[set_mountain, set_hiking_dates, get_current_date],
    before_model_callback=initialize_hiking_context,
    sub_agents=[workflow],
    include_contents="none",
)

app = FastAPI(title="Safehike: Safety-first hiking AI assistant")
safehike_agent = ADKAgent(
    adk_agent=root_agent,
    app_name="safehike_agent",
    user_id="demo_user",
    session_timeout_seconds=3600,
    use_in_memory_services=True,
)
add_adk_fastapi_endpoint(app, safehike_agent, path="/")

