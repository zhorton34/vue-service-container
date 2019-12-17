import GlobalVueClass from 'vue'

class VueServiceContainer {
    constructor(content = {}) {
        this.providers = []
        this.content = content
        this.Vue = GlobalVueClass
        this.bindings = {}
        this.setRootInstance()
    }

    /**
     * Resolve from service container
     * @param bindingKey
     */
    resolve(bindingKey) {
        return this.bindings[bindingKey]
            ? this.bindings[bindingKey](({ ...this.context, app: this.app }))
            : console.error(`Container doesnt can not resolve ${bindingKey}`)
    }

    /**
     * Bind to service container
     */
    bind(key, binding) {
        if (Object.keys(this.bindings).includes(key)) {
            return console.error(`Binding with key: ${key} already exists in the Vue Service Container`)
        }

        this.bindings[key] = binding
    }


    /**
     * Implement Vue Service Container as a Plugin
     * @param Vue
     * @param content
     */
    install(Vue, options = {}) {
        const $container = this
        $container.setVue(Vue)

        Vue.prototype['$container'] = $container
        Vue.prototype['$resolve'] = bindings => Object.keys($container.bindings)
            .filter(binding => bindings.includes(binding))
            .forEach(bind => Vue.prototype[`$${bind}`] = $container.bindings[bind](({ ...$container.context, app: $container.app })))
    }

    /**
     * Better wording for explaining this feature as a means for
     * passing in Php or other "backend" content to our container
     * @param content
     */
    backEndContent(content = {}) {
        this.content = content
    }

    /**
     * Append content, in case we want to add
     * @param content
     */
    addBackEndContent(content = {}) {
        this.content = { ...this.content, ...content }
    }

    /**
     * Set Vue Global Api Instance
     */
    setVue(CustomGlobalVueApi) {
        this.Vue = CustomGlobalVueApi
    }

    /**
     * Set overidable root instance
     */
    setRootInstance() {
        this.root = {
            options: {
                el: '#app',
                name: 'vue-service-container',
                data: () => ({}),
                mixins: [],
                methods: {},
                filters: {},
                computed: {},
                directives: {},
            },
            set(options = {}) {
                Object.entries(options).forEach(([key, setting]) => {
                    this.add(key, setting)
                })
            },
            addVuex(store) {
                this.options.store = store
            },
            add(key, setting = false) {
                const notAnOption = !Object.keys(this.options).includes(key)

                if (notAnOption || !setting) return

                const settingIsArray = Array.isArray(setting)
                const settingIsObject = typeof setting === 'object'
                const settingIsAString = typeof setting === 'string'
                const settingIsAFunction = typeof setting === 'function'

                if (settingIsAString) {
                    this.options[key] = setting
                }
                if (settingIsArray) {
                    this.options[key] = [
                        ...setting,
                        ...this.options[key]
                    ]
                }
                if (settingIsAFunction) {
                    const old = this.options[key]();
                    const append = setting();
                    this.options[key] = () => {
                        return { ...old, ...append }
                    }
                }
                if (settingIsObject && !settingIsArray) {
                    this.options[key] = {
                        ...setting,
                        ...this.options[key]
                    }
                }
            },
        }
    }


    /**
     * Execute all of the booting callbacks.
     */
    boot() {
        this.providers.forEach(({ boot, when }) => when() ? boot() : {})
    }

    /**
     * Execute all of the register callbacks.
     */
    register() {
        this.providers.forEach(({ register, when }) => when() ? register() : {})
    }

    /**
     * Execute all afterLaunch callbacks
     */
    afterLaunch() {
        this.providers.forEach(({ afterLaunch, when }) => when() ? afterLaunch() : {})

        this.providers = []
    }


    /**
     * Start the Container vue app instance by calling each of the callbacks and then creating
     * the underlying Vue instance.
     */
    launch(withRootInstanceOptions = false) {
        this.register()

        this.boot()

        const { root, Vue } = this

        if (withRootInstanceOptions) {
            console.warn('you can configure your root instance within launch, but the launc vue instance options will override any parrellel root (vue instance) options set in your booting or registering callbacks')
            this.root.set(withRootInstanceOptions)
        }

        if (this.root.options.render) {
            const { el } = root.options
            this.app = new Vue(root.options).$mount(el)
        } else {
            this.app = new Vue(this.root.options)
        }

        this.afterLaunch()
    }
}

;(function() {
    this.InitializeContainer = function(content = {}) {
        const Container = new VueServiceContainer(content)

        Container.context = {
            Vue: Container.Vue,
            root: Container.root,
            content: Container.content
        }
        
        Container.addContext = append => Container.context = ({ ...Container.context, ...append })
        Container.context.use = Container.addContext

        Container.providing = service => {
            const provide = {}

            provide.register = () => service.register ? service.register(Container.context) : {}
            provide.boot = () => service.boot ? service.boot(Container.context) : {}
            provide.afterLaunch = () => service.afterLaunch ? service.afterLaunch({ ...Container.context, app: Container.app }) : {}
            provide.when = () => service.when ? service.when(Container.context) : true

            return provide
        }

        Container.provide = service => Container.providers.push(Container.providing(service))

        return Container        
    }
}.call(window))

exports.MakeServiceContainer = function(content = {}) {
    return InitializeContainer(content)
}

