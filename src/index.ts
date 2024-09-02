/* === Imports === */
//                                                                                 // import { getAnalytics } from "firebase/analytics"
import "./index.css"
import { initializeApp } from "firebase/app"
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  updateProfile,
} from "firebase/auth"
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  FieldValue,
  DocumentData,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore"

/* === Firebase Setup === */
const firebaseConfig = {
  apiKey: "AIzaSyCMk0RrBozlUEbDlcVlfGqfR1MJLb6u7j8",
  authDomain: "moody-7df10.firebaseapp.com",
  projectId: "moody-7df10",
  storageBucket: "moody-7df10.appspot.com",
  appId: "1:251233526924:web:fe4da7397615bc3c8a47a9",
}

//                                                                                  //const analytics = getAnalytics(app)
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
const db = getFirestore(app)

/* === UI === */

/* == UI - Elements == */

const viewLoggedOut = document.getElementById("logged-out-view")
const viewLoggedIn = document.getElementById("logged-in-view")
const signInWithGoogleButtonEl = document.getElementById(
  "sign-in-with-google-btn"
)
const emailInputEl = document.getElementById("email-input")
const passwordInputEl = document.getElementById("password-input")
const signInButtonEl = document.getElementById("sign-in-btn")
const createAccountButtonEl = document.getElementById("create-account-btn")
const signOutButtonEl = document.getElementById("sign-out-btn")
const userProfilePictureEl = document.getElementById("user-profile-picture")
const userNameEl = document.getElementById("user-name")
const displayNameInputEl = document.getElementById("display-name-input")
const photoURLInputEl = document.getElementById("photo-url-input")
const updateProfileButtonEl = document.getElementById("update-profile-btn")
const userSection = document.querySelector(".user-section")
const postSection = document.querySelector(".post-container")
const toggleSectionsBtn = document.getElementById("toggle-sections-btn")
const signErrorEl = document.getElementById("sign-error")
const updateErrorEl = document.getElementById("update-error")
const postErrorEl = document.getElementById("post-error")
const moodEmojiEls = document.getElementsByClassName("mood-emoji-btn")
const textareaEl = document.getElementById("post-input")
const postButtonEl = document.getElementById("post-btn")
const allFilterButtonEl = document.getElementById("all-filter-btn")
const filterButtonEls = document.getElementsByClassName("filter-btn")
const postsEl = document.getElementById("posts")

/* == UI - Event Listeners == */

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle)
signInButtonEl.addEventListener("click", authSignInWithEmail)
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail)
signOutButtonEl.addEventListener("click", authSignOut)
updateProfileButtonEl.addEventListener("click", authUpdateProfile)
toggleSectionsBtn.addEventListener("click", toggleSectionsView)
for (let moodEmojiEl of moodEmojiEls) {
  moodEmojiEl.addEventListener("click", selectMood)
}
for (let filterButtonEl of filterButtonEls) {
  filterButtonEl.addEventListener("click", selectFilter)
}
postButtonEl.addEventListener("click", postButtonPressed)

/* === State === */

let moodState = 4

/* === Global Constant === */

const collectionName = "posts"

/* === Main Code === */

onAuthStateChanged(auth, (user) => {
  if (user) {
    showLoggedInView()
    showProfilePicture(user)
    showUserName(user)
    updateFilterButtonStyle(allFilterButtonEl)
    fetchAllPosts()
  } else {
    showLoggedOutView()
  }
})

/* === Functions === */

/* = Functions - Firebase - Authentication = */

async function authSignInWithGoogle() {
  try {
    await signInWithPopup(auth, provider)
    console.log("Sign in with Google")
  } catch (error) {
    console.error("Sign in with Google failed:", getErrorMessage(error))
    signErrorEl.textContent = getErrorMessage(error)
  }
}

async function authSignInWithEmail() {
  const email = (emailInputEl as HTMLFormElement).value
  const password = (passwordInputEl as HTMLFormElement).value

  try {
    await signInWithEmailAndPassword(auth, email, password)

    clearAuthFields()
  } catch (error) {
    console.error("Sign in failed:", getErrorMessage(error))
    signErrorEl.textContent = getErrorMessage(error)
  }
}

async function authCreateAccountWithEmail() {
  const email = (emailInputEl as HTMLFormElement).value
  const password = (passwordInputEl as HTMLFormElement).value

  try {
    await createUserWithEmailAndPassword(auth, email, password)

    sendEmailVerification(auth.currentUser)
    clearAuthFields()
  } catch (error) {
    console.error("Sign up failed:", getErrorMessage(error))
    signErrorEl.textContent = getErrorMessage(error)
  }
}

async function authSignOut() {
  try {
    await signOut(auth)
  } catch (error) {
    console.error("Sign out failed:", getErrorMessage(error))
  }
}

async function authUpdateProfile() {
  const updatedInfo = {
    displayName: (displayNameInputEl as HTMLInputElement).value,
    photoURL: (photoURLInputEl as HTMLInputElement).value
      ? (photoURLInputEl as HTMLInputElement).value
      : auth.currentUser.photoURL,
  }

  if (updatedInfo.displayName) {
    try {
      await updateProfile(auth.currentUser, updatedInfo)

      showProfilePicture(auth.currentUser)
      showUserName(auth.currentUser)

      clearInputField(displayNameInputEl)
      clearInputField(photoURLInputEl)
    } catch (error) {
      console.error("Updating profile failed:", getErrorMessage(error))
      updateErrorEl.textContent = getErrorMessage(error)
    }
  }
}

/* = Functions - Firebase - Cloud Firestore = */

async function addPostToDB(postBody: string, user: User) {
  interface Post {
    body: string
    createdAt: FieldValue
    mood: number
    uid: string
    userName: string
    profilePic: string
  }
  const post: Post = {
    body: postBody,
    createdAt: serverTimestamp(),
    mood: moodState,
    uid: user.uid,
    userName: user.displayName,
    profilePic: user.photoURL,
  }

  try {
    await addDoc(collection(db, collectionName), post)
  } catch (error) {
    console.error("Error adding document: ", getErrorMessage(error))
  }
}

function fetchInRealtimeAndRenderPostsFromDB(
  isAllPosts: boolean,
  start?: Date,
  end?: Date
) {
  const postsRef = collection(db, collectionName)
  let q

  if (isAllPosts) {
    q = query(postsRef, orderBy("createdAt", "desc"), limit(20))
  } else {
    q = query(
      postsRef,
      where("createdAt", ">=", start),
      where("createdAt", "<=", end),
      orderBy("createdAt", "desc"),
      limit(20)
    )
  }

  onSnapshot(q, (querySnapshot) => {
    clearAll(postsEl)

    querySnapshot.forEach((doc) => renderPost(doc.data()))
  })
}

function fetchTodayPosts() {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  fetchInRealtimeAndRenderPostsFromDB(false, startOfDay, endOfDay)
}

function fetchWeekPosts() {
  const startOfWeek = new Date()
  startOfWeek.setHours(0, 0, 0, 0)

  if (startOfWeek.getDay() === 0) {
    // If today is Sunday
    startOfWeek.setDate(startOfWeek.getDate() - 6) // Go to previous Monday
  } else {
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
  }

  const endOfWeek = new Date()
  endOfWeek.setHours(23, 59, 59, 999)

  fetchInRealtimeAndRenderPostsFromDB(false, startOfWeek, endOfWeek)
}

function fetchMonthPosts() {
  const startOfMonth = new Date()
  startOfMonth.setHours(0, 0, 0, 0)
  startOfMonth.setDate(1)

  const endOfMonth = new Date()
  endOfMonth.setHours(23, 59, 59, 999)

  fetchInRealtimeAndRenderPostsFromDB(false, startOfMonth, endOfMonth)
}

function fetchAllPosts() {
  fetchInRealtimeAndRenderPostsFromDB(true)
}

/* == Functions - UI Functions == */

function renderPost(postData: DocumentData) {
  const profilPicLink = postData.profilePic
    ? postData.profilePic
    : "assets/images/default-profile-picture.jpeg"

  postsEl.innerHTML += `
      <div class="post">
        <div class="header">
          <img src="${profilPicLink}" alt="user-pic" />
          <h3>${displayDate(postData.createdAt)}</h3>
          <img src="assets/emojis/${postData.mood}.png" alt="emoji" />
        </div>
        <p class="post-user-name">${postData.userName}</p>
        <p>
          ${replaceNewlinesWithBrTags(postData.body)}
        </p>
      </div>  
  `
}

function replaceNewlinesWithBrTags(inputString: string) {
  return inputString.replaceAll(/\n/g, "<br>")
}

function postButtonPressed() {
  const postBody = (textareaEl as HTMLTextAreaElement).value
  const user = auth.currentUser

  if (postBody && moodState) {
    addPostToDB(postBody, user)
    clearInputField(textareaEl)
    resetAllMoodElements()
    postErrorEl.textContent = ""
  } else {
    postErrorEl.textContent = "Please write your feeling and select mood! 🙂"
  }
}

function showLoggedOutView() {
  hideElement(viewLoggedIn)
  showElement(viewLoggedOut)
}

function showLoggedInView() {
  hideElement(viewLoggedOut)
  showElement(viewLoggedIn)
}

function showElement(element: HTMLElement) {
  element.style.display = "flex"
}

function hideElement(element: HTMLElement) {
  element.style.display = "none"
}

function clearInputField(field: HTMLElement) {
  ;(field as HTMLFormElement).value = ""
}

function clearAuthFields() {
  clearInputField(emailInputEl)
  clearInputField(passwordInputEl)
}

function showProfilePicture(user: User) {
  ;(userProfilePictureEl as HTMLImageElement).src = user.photoURL
    ? user.photoURL
    : "assets/images/default-profile-picture.jpeg" // default image
}

function showUserName(user: User) {
  userNameEl.innerHTML = user.displayName ? user.displayName : "--user--"
}

function toggleSectionsView() {
  userSection.classList.toggle("show")
  postSection.classList.toggle("hide")

  if (postSection.classList.contains("hide")) {
    toggleSectionsBtn.textContent = "Home"
  } else {
    toggleSectionsBtn.textContent = "Profile"
  }
}

function displayDate(firebaseDate: DocumentData) {
  if (!firebaseDate) {
    return "Date processing..."
  }

  const date = firebaseDate.toDate()

  const day = date.getDate()
  const year = date.getFullYear()

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const month = monthNames[date.getMonth()]

  let hours = date.getHours().toString().padStart(2, 0)
  let minutes = date.getMinutes().toString().padStart(2, 0)
  // hours = hours < 10 ? "0" + hours : hours
  // minutes = minutes < 10 ? "0" + minutes : minutes

  return `${day} ${month} ${year} - ${hours}:${minutes}`
}

/* = Functions - UI Functions - Mood = */

function selectMood(event: Event) {
  const selectedMoodEmojiElementId = (event.currentTarget as HTMLInputElement)
    .id

  changeMoodsStyleAfterSelection(selectedMoodEmojiElementId)

  const chosenMoodValue = returnMoodValueFromElementId(
    selectedMoodEmojiElementId
  )

  moodState = chosenMoodValue
}

function changeMoodsStyleAfterSelection(selectedMoodElementId: string) {
  for (let moodEmojiEl of moodEmojiEls) {
    if (selectedMoodElementId === moodEmojiEl.id) {
      moodEmojiEl.classList.remove("unselected-emoji")
      moodEmojiEl.classList.add("selected-emoji")
    } else {
      moodEmojiEl.classList.remove("selected-emoji")
      moodEmojiEl.classList.add("unselected-emoji")
    }
  }
}

function resetAllMoodElements() {
  for (let moodEmojiEl of moodEmojiEls) {
    moodEmojiEl.classList.remove("selected-emoji")
    moodEmojiEl.classList.remove("unselected-emoji")
  }

  moodState = 0
}

function returnMoodValueFromElementId(elementId: string) {
  return Number(elementId.slice(5))
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function clearAll(element: HTMLElement) {
  element.innerHTML = ""
}

/* == Functions - UI Functions - Date Filters == */

function resetAllFilterButtons(allFilterButtons: HTMLCollectionOf<Element>) {
  for (let filterButtonEl of allFilterButtons) {
    filterButtonEl.classList.remove("selected-filter")
  }
}

function updateFilterButtonStyle(element: HTMLElement) {
  element.classList.add("selected-filter")
}

function fetchPostsFromPeriod(period: string) {
  if (period === "today") {
    fetchTodayPosts()
  } else if (period === "week") {
    fetchWeekPosts()
  } else if (period === "month") {
    fetchMonthPosts()
  } else {
    fetchAllPosts()
  }
}

function selectFilter(event: Event) {
  const selectedFilterElementId = (event.target as HTMLInputElement).id
  const selectedFilterPeriod = selectedFilterElementId.split("-")[0]
  const selectedFilterElement = document.getElementById(selectedFilterElementId)

  resetAllFilterButtons(filterButtonEls)
  updateFilterButtonStyle(selectedFilterElement)

  fetchPostsFromPeriod(selectedFilterPeriod)
}
