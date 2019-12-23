## Vue Service Container Overview
- Vue Service Container with Service Providers
- Bind, Resolve, 
- inject back-end data
- code-split and only use the services a specific split requires
- Re-use services across not only code-splits, but also projects


### Video Tutorial
[![vuejs service container tutorial](https://img.youtube.com/vi/ODMTuekriwo/0.jpg)](https://www.youtube.com/watch?v=ODMTuekriwo)


#### 1. Install
```
  npm i vuejs-service-container
```

---
#### Architectural Concepts
---
**Life Cycle**
1. Create Container
2. Use Container As Vue Plugin
3. Inject **content** to Container (Ex: inject json encoded php)
4. Provide Services To Container 
5. Launch Container's Vue Instance
   * **Before Vue Mounts To DOM**
   		* **First** _All_ ServiceProvider **register** hooks execute
        * **Next** _All_ ServiceProvider **boot** hooks execute
   * **Vue Is Mounted To HTML DOM**
        * **Then** _All_ ServiceProvider **afterLaunch** hooks execute

---
##### Step 1 & 2: Create Container & Use as it as a Vue Plugin
---
```
// main.js
import Vue from 'vue'
import { MakeServiceContainer } from 'vuejs-service-container'

// 1. create container
window.Container = MakeServiceContainer({ // inject js content here })

// 2. use container as vue plugin
Vue.use(Container)
```

---
##### Step 3: Inject Content Into Container
---


```
<!-- example.blade.php -->
<script src='./main.js'></script>

<script>
   // INJECT json_encoded backend data
   window.Container.addBackEndContent(@json($phpData)) 
</script>

<!-- Register Service Providers (Explained in later steps) -->
<script src='./container-service-providers.js'></script>

<script>
   // launch container (explained in later steps)
   window.Container.launch()
</script>
```

---
##### Step 4. Create Service Providers
---

```
// container-service-providers.js

const ExampleService = 

// First Service Provider
Container.provide({
  register(context) {},

  boot(context) {},

  afterLaunch(context) {},
})

// Second Service Provider (With Context Object Deconstructed)
Container.provide({
  register({ Vue, root, content, use }) {},

  boot({ Vue, root, content, use }) {},

  // notice after launch has access to our mounted Vue instance
  afterLaunch({ Vue, root, content, use, app }) {},
})
```

---
###### Service Provider "Context" Object (Deconstructed)
---

| Provider Hook | Vue (Global) | root (vue root options) | app (mounted vue instance) | content (injected Ex: json encoded Php) | use (add properties to context) |
|---------------|--------------|-------------------------|----------------------------|-----------------------------------------|---------------------------------|
| register      | true         | true                    | false                      | true                                    | true                            |
| boot          | true         | true                    | false                      | true                                    | true                            |
| afterLaunch   | true         | true                    | true                       | true                                    | true                            |


---
#### Step 5: Launch Container's Vue Instance
---

```
<!-- example.blade.php -->
<script src='./main.js'></script>

<script>
   window.Container.addBackEndContent(@json($phpData)) 
</script>

<!-- Register Service Providers -->
<script src='./container-service-providers.js'></script>

<script>
   // Step 5: LAUNCH container instance
   window.Container.launch()
</script>
```

---
###### What happens when we launch the container?
---
1. **Before Our Vue Instance is Mounted To The DOM**
	* **First** _All_ ServiceProvider **register** hooks execute
    * **Next** _All_ ServiceProvider **boot** hooks execute
2. **Vue Root Instance Is Mounted To DOM**
3. **After Vue Root Instance Is Mounted To DOM**
    * **Then** _All_ ServiceProvider **afterLaunch** hooks execute


---
#### Architectural Concepts In Depth
---
**Life Cycle**
1. Create Container
2. Use Container As Vue Plugin
3. Inject **content** to Container (Ex: inject json encoded php)
4. Provide Services To Container 
5. Launch Container's Vue Instance
   * **Before Vue Mounts To DOM**
   		* **First** _All_ ServiceProvider **register** hooks execute
        * **Next** _All_ ServiceProvider **boot** hooks execute
   * **Vue Is Mounted To HTML DOM**
        * **Then** _All_ ServiceProvider **afterLaunch** hooks execute

---
##### Service Container
---

**Overview**
* The service container is a powerful tool for managing dependencies

**Example** 
* Imagine duplicating this code several times

```
import axios from 'axios'
import Person from 'people'
import Emailable from 'emailable'


axios.get('/person/${idFromUrl}').then((response) => {
  const emailable = new Emailable(response.person.email)

  const person = new Person(response.person, emailable)
})
```

**Instead:** 
* _bind_ the logic for retrieving a person to our container

```
import axios from 'axios'
import Person from 'people'
import Emailable from 'emailable'


Container.provide({
   register({ container, content }) {
      container.bind('person', () => {
         return axios.get(`/person/${idFromUrl}`).then(({ data }) => {
            return new Person(data.person, new Emailable(data.person.email)
         })
      })
   }
})
```

**Then:** 
* _resolve_ person whenever we need access to that logic

```
Container.resolve('person')
```

**Additionally:** 
* You can bind common imports you utilize (for example axios)

```
import axios from 'axios' // you might use this import in hundreds of files

export default {
  methos: {
    axios.get('/whatever-you-desire')
  }
}
```

**Instead:** 
* _bind_ axios to our service container 

```
import axios from 'axios'

Container.provide({
  register({ container }) {
    container.bind('axios', () => axios)
  }
})
```

**Then:** 
* _resolve_ and use axios without needing to import it

```
export default {
  methos: {
    Container.resolve('axios').get('/whatever-you-desire')
  }
}
```

---
##### Service Provider
---
* _Use_ Your own custom context

```
Container.provide({
  register({ use, name }) {
     console.log(name) // undefined

     use({ name: 'sarah' })
  },

  boot({ name }) {
     console.log(name) // "sarah"
  }
})

Container.provide({
  register(context) {
     console.log(context.name) // "sarah"
  },

  boot(context) {
     console.log(context.name) // "sarah"
  },

  afterLaunch({ name }) {
    console.log(name) // "sarah"
  }
})
```

* Determine _When_ to use service provider

**Example:** 
* Only use service provider when on the `/dashboard` page otherwise bypass it 

```

Container.provide({
   register(context) {},
   boot(context) {},
   afterLaunch(context) {},

   when(context) {
      return window.location.pathname === '/dashboard'
   }
```

---
#### Service Providers In Action Examples
---

**1. Register Vuex Store**

```
import Vuex from 'vuex'
import StoreObject from './store.js'

Container.provide({
   register({ Vue, root, use }) {

      // Register Vuex as a vue plugin
      Vue.use(Vuex)

      // create the vuex store from the js StoreObject
      const store = new Vuex.Store(StoreObject)

      // set the store on the root instance
      root.set({ store })
      
      // add store to context so it's accessable to all proceeding provider hooks 
      use({ store })
   },

   // We can commit back-end data to the vuex store BEFORE we create the Vue instance
   boot({ content, store }) {
      store.commit('site', content.website)
   }
})
```

**2. Create Global Event Bus**


```
Container.provide({

    register({ Vue, container }) {
      // 1. create global Event bus on container
      container.$Event = new Vue()
      container.$Event.fire = container.$Event.$emit
      container.$Event.listen = container.$Event.$on
      container.$Event.forget = Container.$Event.$off
      container.$Event.listenOnce = container.$Event.$once

      // 2. Add  allows us to trigger reactive events outside the scope of Vue
      Vue.prototype['$Event'] = container.$Event
    })
```

**3. Register Global Vue Filters**

```
Container.provide({
  register(({ Vue }) {
    Vue.filter('capitalize', str => `${str.charAt(0).toUpperCase()}${str.slice(1)}`)
  }
})
```

**4. Register Global Vue Directives**

```
Container.provide({
   register({ Vue }) {
      Vue.directive('href', (el, bind, vnode) => {
        el.onclick = () => window.location = bind.value
      })
  }
})
```

**5. Register Global Vue Components**

```
import ExampleGlobalComponent from '@Global/example-global-component'
 
Container.provide({
    register({ Vue }) {
    	Vue.component('example-global-component', ExampleGlobalComponent)
    }
})
```

**6. Add Vue Router**

```
import VueRouter from 'vue-router'
import routes from './routes'

Container.provide({
   register({ Vue, root, use }) {
      // 1. Register Vue Router As A Plugin
      Vue.use(VueRouter)

      // 2. create router from routes object
      const router = new VueRouter({ routes })
  
      // 3. set router on route instance
      root.set({ router })

      // 4. add router to context
      use({ router })
   }
})
```


**7. Redirect user to vue route after instance launches when they are authenticated**

```
Container.provide({
   afterLaunch({ app }) {
      app.$router.push({ name: 'dashboard' })
   },

   when({ content }) {
      return content.user.authenticated === true
   },
})
```

_I'm guessing you're starting to get the idea ~ this is an extremely powerful tool. But, we haven't gotten to the most important part yet 

**Code Splitting**


---
### Code Splitting
---

###### **Definition from google**
___
"**_Modern sites often combine all of their JavaScript into a single, large bundle. ... An alternative to large bundles is code-splitting, which is where JavaScript is split into smaller chunks. This enables sending the minimal code required to provide value upfront, improving page-load times. The rest can be loaded on demand._**"



### Code splitting setup
---

**Remember our example.blade.php file from earlier?**

1. Change `container-service-providers.js` to `global-service-providers.js` 

2. Add a dynamic, page or feature specific route ~ and add a script responsible for page   
   or feature specific service providers

**Instead of this:**

```
<!-- example.blade.php -->
<script src='./main.js'></script>

<script>
   // INJECT json_encoded backend data
   window.Container.addBackEndContent(@json($phpData)) 
</script>

<!-- Register Service Providers (Explained in later steps) -->
<script src='./container-service-providers.js'></script>

<script>
   // launch container (explained in later steps)
   window.Container.launch()
</script>
```

**We'll do this:**

```
<!-- example.blade.php -->
<script src='./main.js'></script>

<script>
   // INJECT json_encoded backend data
   window.Container.addBackEndContent(@json($phpData)) 
</script>

<!-- Register Service Providers (Explained in later steps) -->
<script src='./global-service-providers.js'></script>

<!-- Add dynamically referenced route -->
<sciprt src="{{ \Route::name() }}-service-providers.js"></script>

<script>
   // launch container (explained in later steps)
   window.Container.launch()
</script>
```

**Then, using webpack or webpack mix ~ split out your code**


**Example (Laravel Mix)**

```
const mix = require('laravel-mix')

mix.js('src/main.js', 'public/js')
    .js('src/dashboard-service-providers.js', 'public/dashboard-service-providers.js')
    .js('src/about-service-providers.js', 'public/about-service-providers.js')
```

**dashboard-service-providers.js (Split A)**

```
import Toasted from 'vue-toasted'
import Dashboard from '@Component/dashboard'

Container.provide({
   register({ Vue, root, content }) {
      Vue.use(Toasted, content.user.theme)

      Vue.component('dashboard', Dashboard)

      root.set({ 
        name: 'dashboard', 
        el: '#dashboard' 
      })
   },

   boot({ store, content }) {
      store.commit('activity', content.user.activity)
   },

   afterLaunch({ app, content }) {
      app.$toasted.show(`Welcome back ${content.user.name}!`)
   }
})
```

**about-service-providers.js (Split B)**

```
import AboutUs from '@Component/about-us'

Container.provide({
   register({
      Vue.component('about-us', AboutUs)

      // By default, root will mount to the element with an id of #app
      root.set({ name: 'about-us' })
   })
})  
```

Keep on splitting and only use the services and code required ~ simplify! :)

**Closing Notes**

_A: "I've notices that by code splitting, I can usually just define all vue components as global, removing the need to import so many files outside of the service container's providers. But, you can still import local vue components within the global 'about-us' component or 'dashboard' component. I prefer not to."_ 

_B: "You can also use Vue inline templates to not only have access to your back-end data within the providers and container ~ but also within your Vue template itself. This can be somewhat unorthodox to set up, but I have personally done it within Laravel Blade and know it is doable within vanilla Php and Symfony's Twig Templating engine. This allows you to use the best of both Vue's templating engine and the Php templating engine of your choice._

_C: "I will be making a video tutorial on this package (hopefully in the next week or two), but in the mean time feel free to reach out with any questions or concerns and by all means fork the repo and see what you can do with it ~ it's a pretty small package considering everything it can do ~ but there are some pretty interesting features to dive into that I just haven't had the time to get to as of yet (Ex: proxies, dependency injection, singletons, etc...)"_


___

All the best, Zachary Horton
___


**Clean Code Studio ~ Simplify!**

_Clean Code Clean Life_
