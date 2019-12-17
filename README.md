# Vue Service Container Overview
- Container Around Vue Instance
- Hook into Multiple Callbacks before and after vue instance is launched
    - registering(callback) hook
    - booting(callback) hook
    - afterLaunching(callback) hook
- Add as many callbacks for a given hook as needed
- Create hooks, and import them as needed to support extremely optimal code splitting

#### 1. Install
```
  npm i vue-service-container
```

#### 2. Import  
``` 
   import { CreateVueServiceContainer } from 'vue-services-container'
```


#### 3. Create Container as a property on the window
``` 
window.Container = CreateVueServiceContainer(config)
```
- config parameter 
    - NOT container configuration object
    - config can be an empty object
    - In many scenarios, you can json_encode back-end data and pass it in as the config to the container
    - all container callbacks have access to this config object
    

#### 4. Inject Global Vue Instance Into Container (Recommended, but not required)
```
// recommended to pass your own Vue Class into the container but not required
import Vue from 'vue'

window.Container.setVue(Vue)
```
- Recommended to avoid "complex" conflicts 
- Containers has its own Vue Global API if you opt out of this option
- registering, booting, and afterLaunching callbacks
    - Accept a Global Vue Class
    - If you don't override the Container default Vue Class
        - And You update your application Vue Prototype
        - The Container Vue Prototype Will not Inherit those changes


#### 5.Register Global Vue Config
- https://vuejs.org/v2/api/#Global-Config
- To use vue devtools use the snippet
``` 
window.Container.registering(({ Vue, config }) => {
    Vue.config.silent = false
    Vue.config.devtools = true

    // add config object we passed in to our vue prototype so all vue instances
    // have access to whatever data we wanted to pass in from either a random json object
    // or json encode data from the back end
    Vue.prototype['config' ] = config
})
```


#### 6. Register Vuex store and add parameters to callbacks
- use the following snippet to inject vuex into your instance
``` 
import Vuex from 'vuex'
import store from './store'

window.Container.registering(({ Vue, root, container }) => {
    // 1. Use Vuex as a Vue plugin
    Vue.use(Vuex)

    // 2. add the vuex store the root vue instance
    root.addVuex(new Vuex.Store(store))
    
    // 3. add the store as parameter for all proceeding callbacks
    container.addRegisterParameters({ store })
    container.addBootParameters({ store })
    container.addAfterLaunchParameters({ store })
})
```


#### 7. Register Vue plugins
``` 
import VueRouter from 'vue-router'

window.Container.registering(({ Vue }) => {
    Vue.use(VueRouter)
})
```

#### 8. Configure root instance
``` 
window.Container.registering(({ root }) => {
   root.set({
      el: '#app',
      name: 'about-us-page',
   })
})
```

#### 9. Register Global Container Event Bus
``` 
window.Container.registering(({ Vue, container }) => {

    // 1. create global Event bus on container
    container.Event = new Vue()
    container.Event.fire = container.Event.$emit
    container.Event.listen = container.Event.$on
    container.Event.forget = Container.Event.$off
    container.Event.listenOnce = container.Event.$once
    
    // 2. add event bus to vue prototype this allows us to trigger reactive events outside the scope of Vue
    Vue.prototype['Event'] = container.Event

}) 
```

#### 10. Register Global Vue Filters
``` 
window.Container.registering(({ Vue }) => {
    Vue.filter('capitalize', str => str.charAt(0).toUpperCase() + str.slice(1)) 
})

```

#### 11. Register Global Vue Directives
``` 
window.Container.registering(({ Vue }) => {
    Vue.directive('href', (element, bind, vnode) => {
        element.onclick = () => window.location = bind.value
    })
})
```

#### 12. Register Global Vue Components
```
import ExampleGlobalComponent from '@Global/example-global-component'
 
window.Container.registering(({ Vue }) => {
    Vue.component('example-global-component', ExampleGlobalComponent)
})
```


#### 13. Interact With Vuex Store Before We Launch Our Instance
- In step 6 we added store as an additional callback parameter
- Our vue instance does NOT need to be mounted to interact with vuex
- Interact with vuex directly
- Then, when we launch ~ the instance will get the stores current state
``` 
window.Container.registering(({ store, config }) => {
    store.commit('theme/colors', config.theme.colors)
})
```

- Default registering callback parameters
    - Vue
        - Interact with global Vue API
        - https://vuejs.org/v2/api/#Global-API
        - Or Global Vue Api Object you set 
``` 

window.Container.registering({ Vue, container, root, config, 

```  

#### I recommend adding all Vue stuff you'll re-use globally in registering callbacks
- Since our Container is globally registered to the window
    - These register callbacks can all be there own file
    - Then require/import each file that contains a register callback
    - This allows for code splitting, and if we dont need something
        - Dont require or import that callback
        
        
#### Final notes on the registering callback
- Default registering callback parameters
    - config 
        - What we passed in to the CreateVueContainer function at the very beginning
    - Vue
        - Global Vue Object
    - root
        - What will be the root vue instance when we run Container.launch()
    - container
        - Global Vue Service Container (Same thing as window.Container)
    - any addedRegisterParameters
        - add additional register callback params using 
            ```
              Container.addRegisterParameters({ addedParameter: 'example' })
            ```



 
#### 14. Add Booting Callbacks
```
// about us page
import '@Bootstrap/container'
import '@Bootstrap/registering-container-callbacks
import AboutUsSummary from './component/about-us-summary'

window.Container.booting(({ Vue, root }) => {
    root.set({ name: 'about-us-page' })
    Vue.component('about-us-summary', AboutUsSummary)
})
```
- Not by code splitting, we can actually register pretty much all components globally
  - When done correctly
    - No page, with the exception of poorly designed or very rare cases
    - We won't need to keep our component imports local because we'll only be loading the components
      we need for this given about page ~ not the entire site
  

#### 15. Use Code Splitting (Highly Recommended)
 - Personally, I like booting callbacks to be specific to a code split
    - I recommend registering callbacks to be ran on every page
    - I recommend booting callbacks to be ran on specific pages
    - registering callbacks execute before booting callbacks
    - Depending on the page the user lands on, we load a different script
        - import the container
        - import all of the registering callbacks
            - registering callbacks are what will be shared on every page
    - Add feature/page components, filters, plugins, etc... within the pages booting callback
    - Example of Three different pages when using code splitting

###### Split A. Contact Us Page       
``` 
// contact us page
import '@Bootstrap/container'
import '@Bootstrap/registering-container-callbacks
import ContactUsForm from './component/contact-us-form'

window.Container.booting(({ Vue, root }) => {
   root.set({ name: 'contact-us-page' })
   Vue.component('contact-us-form', ContactUsForm)
})
```

###### Split B. About us page
```
// about us page
import '@Bootstrap/container'
import '@Bootstrap/registering-container-callbacks'
import AboutUsSummary from './component/about-us-summary'

window.Container.booting(({ Vue, root }) => {
    root.set({ name: 'about-us-page' })
    Vue.component('about-us-summary', AboutUsSummary)
})
```

###### Split C. Blog Page
```
// Home page
import '@Bootstrap/container'
import '@Bootstrap/registering-container-callbacks
import BlogContent from './component/blog-content'
import BlogComment from './component/blog-comment'
import BlogSidebar from './component/blog-sidebar'
import BlogAuthorSection from './component/blog-author-section'

window.Container.booting(({ Vue, root }) => {
    root.set({ name: 'blog-page' })
    Vue.component('blog-content', BlogContent)
    Vue.component('blog-comment', BlogComment)
    Vue.component('blog-sidebar', BlogSidebar)
    Vue.component('blog-author-section', BlogAuthorSection)
})
```




#### 16. Register afterLaunching callbacks
- afterLaunching callbacks have access to the app (AKA the vue instance)
``` 
window.Container.afterLaunching(({ container, app }) => {
    // register a global logout method on your container instance
    // using a ref registered on your app instance
    container.logout() = () => app.$refs['logoutForm'].submit()
})
```
 
 
 #### 17. Once Everything is Registered, Launch Your App
 - launch 
    - executes registering callbacks
    - executes booting callbacks
    - launches our Vue instance
    - executes afterLaunching callbacks
``` 
window.Container.launch() 
```

Zachary Horton ~ Clean Code Studio ~ Clean Code Clean Life ~ Simplify!
https://cleancode.studio
https://zaktechtips.cleancode.studio


#### CleanCodeStudio VueJS Tutorials

Vue JS Reactivity & The Virtual DOM
https://www.youtube.com/watch?v=UATgNA8_X5c&list=PLNuh5_K9dfQ1RaUIgP9-LnQuoAc2tFZUO&index=2&t=0s

Vue's Reactivity System
https://www.youtube.com/watch?v=twe-QvJF-x4&list=PLNuh5_K9dfQ1RaUIgP9-LnQuoAc2tFZUO&index=3&t=0s

Vue's Virtual DOM
https://www.youtube.com/watch?v=F3TQs1pUgzM&list=PLNuh5_K9dfQ1RaUIgP9-LnQuoAc2tFZUO&index=4&t=0s

Vue Data Options ~ Two Way Binding Data
https://www.youtube.com/watch?v=u388ib0KdL8&list=PLNuh5_K9dfQ1RaUIgP9-LnQuoAc2tFZUO&index=5&t=0s

Vue JS ~ Methods, Events, and Event Modifiers
https://www.youtube.com/watch?v=q6ydM0VJ_ck&list=PLNuh5_K9dfQ1RaUIgP9-LnQuoAc2tFZUO&index=6&t=0s

Refactoring VueJS to be more Data Centric
https://www.youtube.com/watch?v=S_w69yD5Gko&list=PLNuh5_K9dfQ1RaUIgP9-LnQuoAc2tFZUO&index=7&t=0s

Vue Computed Properties
https://www.youtube.com/watch?v=CgBK4dbVZPY&list=PLNuh5_K9dfQ1RaUIgP9-LnQuoAc2tFZUO&index=8&t=0s

Vuejs Watchers
https://www.youtube.com/watch?v=TnJp2EEdOZM&list=PLNuh5_K9dfQ1RaUIgP9-LnQuoAc2tFZUO&index=9&t=0s

Vue JS Props 
https://www.youtube.com/watch?v=0HMkrrx6krw&list=PLNuh5_K9dfQ1RaUIgP9-LnQuoAc2tFZUO&index=10&t=0s
