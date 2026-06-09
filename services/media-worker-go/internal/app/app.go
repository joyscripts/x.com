package app

import "log"

type Worker struct{}

func New() *Worker {
	return &Worker{}
}

func (worker *Worker) Run() error {
	log.Println("media worker scaffold started")
	return nil
}
