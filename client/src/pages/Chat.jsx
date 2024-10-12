import React, { useContext, useEffect, useState, useRef } from "react";
import Avatar from "../components/Avatar";
import Logo from "../components/Logo";
import { UserContext } from "../context/UserContext";
import { uniqBy } from "lodash";
import axios from "axios";
import Contact from "../components/Contact";

const Chat = () => {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { id, setId, setUsername } = useContext(UserContext);
  const [newMessageText, setNewMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const divUnderMessages = useRef();

  useEffect(() => {
    connectToWs();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  useEffect(() => {
    axios.get("/people").then((res) => {
      let offlinePeople = {};
      const offlinePeopleArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      offlinePeopleArr.forEach((p) => {
        offlinePeople[p._id] = p.username;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  const connectToWs = () => {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      console.log("Disconnected. Trying to reconnect...");
      setTimeout(() => {
        connectToWs();
      }, 1000);
    });
  };

  const showOnlinePeople = (peopleArray) => {
    let people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  };

  const handleMessage = (e) => {
    const messageData = JSON.parse(e.data);
    if ("online" in messageData) showOnlinePeople(messageData.online);
    else if ("text" in messageData)
      if (messageData.sender === selectedUserId)
        setMessages((prev) => [...prev, { ...messageData }]);
  };

  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) div.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  let onlinePeopleExcludingLoggedInUser = { ...onlinePeople };
  delete onlinePeopleExcludingLoggedInUser[id];

  const messagesWithoutDuplicates = uniqBy(messages, "_id");

  const sendMessage = (e, file = null) => {
    if (e) e.preventDefault();
    ws.send(
      JSON.stringify({
        message: {
          recipient: selectedUserId,
          text: newMessageText,
          file
        },
      })
    );
    setNewMessageText("");
    setMessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      },
    ]);
    if (file) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  };

  const sendFile = (e) => {
    const reader = new FileReader()
    reader.readAsDataURL(e.target.files[0])
    reader.onload = () => {
      sendMessage(null, {
        name: e.target.files[0].name,
        data: reader.result
      })
    }
  }

  const logout = () => {
    axios.post('/logout').then(() => {
      setWs(null)
      setId(null)
      setUsername(null)
    })
  }

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3">
        <div className="flex items-center px-2">
          <div className="flex-grow">
            <Logo />
          </div>
          <button onClick={logout} className="text-blue-600 pr-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
          </svg>
          </button>
        </div>
        {Object.keys(onlinePeopleExcludingLoggedInUser).map((userId) => (
          <Contact
            key={userId}
            userId={userId}
            username={onlinePeopleExcludingLoggedInUser[userId]}
            onClick={() => setSelectedUserId(userId)}
            online={true}
            selected={userId === selectedUserId}
          />
        ))}
        {Object.keys(offlinePeople).map((userId) => (
          <Contact
          key={userId}
            userId={userId}
            username={offlinePeople[userId]}
            onClick={() => setSelectedUserId(userId)}
            online={false}
            selected={userId === selectedUserId}
          />
        ))}
      </div>
      <div className="bg-blue-100 w-2/3 p-2 flex flex-col">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full justify-center items-center">
              <div className="text-gray-400 text-2xl">
                &larr; Select a person to chat
              </div>
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute inset-0">
                {messagesWithoutDuplicates.map((message) => (
                  <div
                    key={message._id}
                    className={
                      message.sender === id ? "text-right" : "text-left"
                    }
                  >
                    <div
                      className={
                        "text-left inline-block p-2 my-2 rounded-lg text-sm " +
                        (message.sender === id
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-500")
                      }
                    >
                      {message.text}
                      {message.file && (
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                          </svg>
                          <a className="underline" href={axios.defaults.baseURL + '/uploads/' + message.file}>
                            {message.file}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Type your message here"
              className="bg-white p-2 flex-grow outline-none rounded-sm"
            />
            <label htmlFor="file" className="bg-blue-200 text-gray-600 p-2 rounded-sm cursor-pointer">
              <input type="file" id="file" className="hidden" onChange={sendFile} />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
              </svg>
            </label>
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;
