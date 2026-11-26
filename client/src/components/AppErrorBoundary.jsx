import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md rounded-lg bg-white p-6 text-center shadow-lg" role="alert">
            <h1 className="text-xl font-bold">Не удалось открыть страницу</h1>
            <p className="mt-3">Обновите приложение и попробуйте ещё раз.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-lg primary-action px-5 py-3 font-bold">
              Обновить приложение
            </button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
