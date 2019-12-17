# Vue Service Container Overview
- Container Around Vue Instance
- Create Service Providers
- Register Services
- Boot Services
- Interact With Services After We Launch And Mount Our Vue Instance
- Determine "When" These Services Should used 
- Provide As Many Services As You'd Like to Vue
- Create Providers, and use them only needed...sopports extremely optimal code splitting

#### 1. Install
```
  npm i vue-service-container
```

#### 2. Import and Make Container
``` 
   import Vue from 'vue'
   import { MakeServiceContainer } from 'vue-service-container'

   window.Container =  (MakeServiceContainer({ // optional content })).setVue(Vue)

```

#### 3. Pass Php or Back-end Json Encoded Content To Container Providers (json_encoded php)
```
    <script src='./make-vue-service-container.js'></script>

    <script>
       window.Container.addBackEndContent(jsonEncodedPhp)
    </script>

    <script src='./register-service-providers'></script>

    <script>
       Container.launch()
    </script>
```


#### 4. Make Container Service Providers
```
  Container.provide({
    // Register services (before mounting vue to DOM)
    register(context) {

    },

    // Boot services (before mounting vue)
    boot(context) {

    },

    // afterLaunching, AKA mounting our Vue Instance to the DOM do some stuff
    afterLaunch(context) {

    },

    // Determine when to use this service provider (defaults to always be true if "when" isn't added)
    when(context) {

    }
  })
```